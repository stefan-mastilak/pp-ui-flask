import json
import os
import re
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from dotenv import load_dotenv
from config import LOCALHOST_MODE


if LOCALHOST_MODE:
    load_dotenv()
    creds_file = os.getenv('GS_API_CREDS')
    mappings_file_token = os.getenv('MAPPING_SPREADSHEET_TOKEN_TEST')
else:
    with open('./secrets/GS_API_CREDS_TEST/GS_API_CREDS_TEST', 'r') as f:
        creds_file = f.read()

    with open('./secrets/MAPPING_SPREADSHEET_TOKEN_TEST/MAPPING_SPREADSHEET_TOKEN_TEST', 'r') as f:
        mappings_file_token = f.read()


# This needs to be done only for the first time - token will be stored in token.txt file
'''
from google_auth_oauthlib.flow import InstalledAppFlow
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
flow = InstalledAppFlow.from_client_config(json.loads(creds_file), SCOPES)
credentials = flow.run_local_server(port=0)
with open("token.txt", "w") as token:
    token.write(creds.to_json())
'''

credentials = Credentials.from_authorized_user_info(json.loads(mappings_file_token))

if not credentials.valid:
    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())


def get_creds():
    """
    Method creating instance of Google sheet
    :return: Instance of Google sheet
    """
    service = build('sheets', 'v4', credentials=credentials)
    sheet = service.spreadsheets()
    return sheet


def get_dep_emp_mapping():
    """
    Method for getting department - employee mapping from Gsheet pp_mappings
    NOTE: sheet name is dep_emp_mapping
    :return: gsheet data as dict
    """
    sheet = get_creds()
    data = sheet.values().get(spreadsheetId='1yNzntfyhfPNls7inR1oiOlzKVa7mriFuWmaFz_eOh_M',
                              range='dep_emp_mapping').execute()
    header = data.get('values')[0]
    values = data.get('values')[1:]
    for i in range(len(values)):
        values[i] = dict(zip(header, values[i]))

    return {i['Product']: [j for j in values if i['Product'] == j['Product']] for i in values}


def get_periods():
    """
    Method for getting periods from Gsheet pp_mappings. (periods according to financial calendar)
    NOTE: sheet name is periods
    :return: gsheet data as dict
    """
    sheet = get_creds()
    data = sheet.values().get(spreadsheetId='1yNzntfyhfPNls7inR1oiOlzKVa7mriFuWmaFz_eOh_M',
                              range='periods').execute()
    header = data.get('values')[0]
    values = data.get('values')[1:]
    for i in range(len(values)):
        values[i] = dict(zip(header, values[i]))

    return values


def normalize_date(date_str):
    """
    Normalize if date_str contains other separators like -_/ and join with a dot
    (leave it if it only contains dots)
    """
    if re.search(r'[-_/]', date_str):
        parts = re.split(r'[-_/]', date_str)
        normalized_date = '.'.join(parts)
    else:
        normalized_date = date_str
    return normalized_date