# Severa API Handler

import os
import requests
import logging
from dotenv import load_dotenv
from google.cloud import storage
from config import LOCALHOST_MODE


def get_token(blob, bucket='severa-tokens'):
    """
    Retrieve the token from a file.
    :param bucket:
    :param blob:
    :return:
    """
    client = storage.Client()
    bucket = client.get_bucket(bucket)
    blob = bucket.blob(blob)
    return blob.download_as_string().decode('utf-8')


def put_token(blob, token, bucket='severa-tokens'):
    """
    Store the token in a file.
    :param token: the token to be stored
    :type token: str
    :param bucket: the bucket where the token will be stored
    :type bucket: str
    :param blob: the blob name
    :type blob: str
    """
    client = storage.Client()
    bucket = client.get_bucket(bucket)
    blob = bucket.blob(blob)
    blob.upload_from_string(token)


if LOCALHOST_MODE:
    load_dotenv()
    CLIENT_ID = os.getenv('SEVERA_CLIENT_ID')
    CLIENT_SECRET = os.getenv('SEVERA_CLIENT_SECRET')
    API_URL = os.getenv('SEVERA_API_URL')
    SCOPE = os.getenv('SEVERA_SCOPE')
else:
    CLIENT_ID = get_token('SEVERA_CLIENT_ID')
    CLIENT_SECRET = get_token('SEVERA_CLIENT_SECRET')
    API_URL = get_token('SEVERA_API_URL')
    SCOPE = get_token('SEVERA_SCOPE')


class SeveraApiHandler:
    """
    Severa API Handler class.
    """
    def __init__(self, token=None, refresh_token=None):
        """
        Generate access and refresh token for Severa API.
        Optional <not implemented> - track token TTL to know when it will need to be refreshed again.
        NOTE: There's not /validate endpoint in Severa API to check if the token is still valid, thus we're
        calling the /users endpoint with a limit of 1 row to check if the token is still valid.
        """
        self.token = token
        self.refresh_token = refresh_token
        if not token or not refresh_token:
            self.token, self.refresh_token, self.token_ttl = self.get_token()

    @staticmethod
    def get_token():
        """
        Generates Access and Refresh Tokens for Severa API.
        :returns: The Access and Refresh token as tuple.
        """
        headers = {"Content-Type": "application/json"}

        body = {"client_Id": CLIENT_ID,
                "client_Secret": CLIENT_SECRET,
                "scope": SCOPE}

        response = requests.post(url=f"{API_URL}/token",
                                 headers=headers,
                                 json=body)

        if response.status_code != 200:
            logging.error(f"Could not create a new token\nError code: {response.text}")
            raise ConnectionError(f'Error: {response.text}')
        else:
            logging.info("A new Access and Refresh token was generated")

        response = response.json()

        # Store Tokens in severa-tokens bucket:
        put_token("SEVERA_ACCESS_TOKEN", response['access_token'])
        put_token("SEVERA_REFRESH_TOKEN", response["refresh_token"])

        return response['access_token'], response["refresh_token"], response["expires_in"]

    def validate_token(self):
        """
        Used to validate if the API Token for Severa expired.
        :returns: True if the Token could be created (either a new one or via the Refresh Token), False otherwise.
        :rtype: bool
        """
        headers = {"Authorization": f"Bearer {self.token}",
                   "client_id": CLIENT_ID}

        response = requests.get(url=f"{API_URL}/users",
                                headers=headers,
                                params={"rowCount": 1})

        if response.status_code != 200:
            logging.error(f"Invalid token\nError: {response.text}")
            return False
        logging.info("Token is valid")
        return True

    def refresh_expired_token(self):
        """
        Generates new Access and Refresh tokens from an already existing Refresh Token for Severa.
        It is used in case the Access Token expires
        :returns: Access and Refresh token as tuple.
        """
        headers = {"Content-Type": "application/json",
                   "client_id": CLIENT_ID}

        response = requests.post(url=f"{API_URL}/refreshtoken",
                                 headers=headers,
                                 json=self.refresh_token)

        if response.status_code != 200:
            logging.error(f"Could not create a new token\nError: {response.text}")
            raise ConnectionError(f'Error: {response.text}')
        else:
            logging.info("A new Access and Refresh token was generated")

        response = response.json()
        # Store Tokens in severa-tokens bucket:
        put_token("SEVERA_ACCESS_TOKEN", response['access_token'])
        put_token("SEVERA_REFRESH_TOKEN", response["refresh_token"])

        self.token = response['access_token']
        self.refresh_token = response['refresh_token']

    def get_user_guid(self, email):
        """
        Makes a Severa API call in order to retrieve the user guid based on the email address match.
        :param email: the email of the user for which the guid is retrieved
        :return: the user guid as string
        :rtype: str
        """
        if not self.validate_token():
            self.refresh_expired_token()

        headers = {"Authorization": F"Bearer {self.token}",
                   "client_id": CLIENT_ID}

        response = requests.get(url=f"{API_URL}/users?email={email}",
                                headers=headers)

        if response.status_code == 200:
            response_json = response.json()
            if not response_json:
                logging.error(msg=f"No user found with the provided email address: {email}")
                return False
            else:
                user = response_json[0]
                if "guid" in user.keys():
                    return user["guid"]

        else:
            logging.error(response.json())
            return False

    def get_user_projects(self, user_guid, only_active=True):
        """
        Fetch data from the projects endpoint in Severa API for a specific user based on guid match.
        :param user_guid: Severa user guid
        :param only_active: if True, only active projects will be returned (True by default)
        :return: user projects data as response.json()
        :rtype: dict
        """
        if not self.validate_token():
            self.refresh_expired_token()

        headers = {"Authorization": f"Bearer {self.token}",
                   "client_id": CLIENT_ID}

        api_str = f"{API_URL}/projects?projectOwnerGuid={user_guid}&isClosed=False" if only_active \
            else f"{API_URL}/projects?projectOwnerGuid={user_guid}"

        response = requests.get(url=api_str,
                                headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            logging.error(response.json())
            return {}

    def get_project_data(self, project_guid):
        """
        Fetch data from the project expenses endpoint in Severa API for a specific project based on project guid match.
        :param project_guid: Severa project guid
        :return: project data as response.json()
        :rtype: dict
        """
        if not self.validate_token():
            self.refresh_expired_token()

        headers = {"Authorization": f"Bearer {self.token}",
                   "client_id": CLIENT_ID}

        response = requests.get(url=f"{API_URL}/projects/{project_guid}",
                                headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            logging.error(response.json())
            return {}

    def get_project_workhours(self, project_guid):
        """
        Fetch data from the project hours endpoint in Severa API for a specific project based on project guid match.
        :param project_guid: Severa project ID
        :return: project hours as response.json()
        :rtype: dict
        """

        if not self.validate_token():
            self.refresh_expired_token()

        headers = {"Authorization": f"Bearer {self.token}",
                   "client_id": CLIENT_ID}

        response = requests.get(url=f"{API_URL}/projects/{project_guid}/workhours",
                                headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            logging.error(response.json())
            return {}

    def get_project_worktypes(self, project_guid):
        """
        Fetch all work types for the project from Severa API.
        :param project_guid: Severa project guid
        :return: project work types as response.json()
        :rtype: dict
        """
        if not self.validate_token():
            self.refresh_expired_token()

        headers = {"Authorization": f"Bearer {self.token}",
                   "client_id": CLIENT_ID}

        response = requests.get(url=f"{API_URL}/projects/{project_guid}/projectworktypes",
                                headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            logging.error(response.json())
            return {}
