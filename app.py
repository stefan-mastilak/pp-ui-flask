# Import libraries:

import json
import os
import requests
from datetime import datetime
from database_handler import get_finance_data, BigQueryHandler
from flask import Flask, render_template, redirect, request, session, flash, jsonify
from oauthlib import oauth2
from severa_handler import SeveraApiHandler, get_token
from dotenv import load_dotenv
from oauthlib.oauth2 import InvalidGrantError, InvalidClientIdError
from mapping_handler import get_dep_emp_mapping, get_periods, normalize_date
from config import LOCALHOST_MODE

# Load environment variables (local or GCP - based on LOCALHOST_MODE defined in config.py)
if LOCALHOST_MODE:
    load_dotenv()
    REDIRECT_URI = os.getenv('REDIRECT_URI_TEST_LOCAL')
    CLIENT_ID = os.getenv('GCP_CLIENT_ID_TEST')
    CLIENT_SECRET = os.getenv('GCP_CLIENT_SECRET_TEST')
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './iac/credentials/cloud_build_sc_acc_creds.json'
else:
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './secrets/CLOUD_BUILD_SC_ACC/CLOUD_BUILD_SC_ACC'
    with open('./secrets/REDIRECT_URI_TEST/REDIRECT_URI_TEST', 'r') as f:
        REDIRECT_URI = f.read()
    with open('./secrets/GCP_CLIENT_ID_TEST/GCP_CLIENT_ID_TEST', 'r') as f:
        CLIENT_ID = f.read()
    with open('./secrets/GCP_CLIENT_SECRET_TEST/GCP_CLIENT_SECRET_TEST', 'r') as f:
        CLIENT_SECRET = f.read()

GOOGLE_AUTH_DATA = {
    'response_type': 'code',  # this tells the auth server that we are invoking authorization workflow
    'redirect_uri': REDIRECT_URI,  # redirect URI https://console.developers.google.com/apis/credentials
    'scope': 'https://www.googleapis.com/auth/userinfo.email',  # resource we are trying to access through Google API
    'client_id': CLIENT_ID,  # client ID from https://console.developers.google.com/apis/credentials
    'prompt': 'consent'}  # consent screen

GOOGLE_AUTH_URL_DICT = {
    'google_oauth': 'https://accounts.google.com/o/oauth2/v2/auth',  # Google OAuth URI
    'token_gen': 'https://oauth2.googleapis.com/token',  # URI to generate token to access Google API
    'get_user_info': 'https://www.googleapis.com/oauth2/v3/userinfo'  # URI to get the user info
}

# Create a Sign in URI
CLIENT = oauth2.WebApplicationClient(CLIENT_ID)
REQ_URI = CLIENT.prepare_request_uri(uri=GOOGLE_AUTH_URL_DICT['google_oauth'],
                                     redirect_uri=GOOGLE_AUTH_DATA['redirect_uri'],
                                     scope=GOOGLE_AUTH_DATA['scope'],
                                     prompt=GOOGLE_AUTH_DATA['prompt'])


# Get period data:
def __get_period_info():
    """
    Get the current period info.
    :return: period info as dict:
    (keys: period_index, period_name, start_date, end_date, year, period_start_ts, period_end_ts)
    """
    data = get_periods()
    now = datetime.now().timestamp()

    # identify the current period:

    for period in data:
        # Normalize the date format
        start_date = normalize_date(period['start_date'])
        end_date = normalize_date(period['end_date'])

        # Parse the normalized dates
        start = datetime.strptime(start_date, '%d.%m.%Y').timestamp()
        end = datetime.strptime(end_date, '%d.%m.%Y').timestamp()

        # Check if the current time is within the period
        if start <= now <= end:
            # add more info the period dict:
            year = start_date.split('.')[-1]
            period['year'] = year
            period['period_start_ts'] = start
            period['period_end_ts'] = end
            return period


# Create flask instance
app = Flask(__name__,
            static_url_path='',
            static_folder='./static/',
            template_folder='./templates/')


# Ensure all responses aren't cached
@app.after_request
def add_header(response):
    """
    No cache header for all responses.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# Error handler for InvalidGrantError
@app.errorhandler(InvalidGrantError)
def handle_invalid_grant_error(error):
    """
    Error handler for InvalidGrantError with redirect to login page.
    - As this error is raised when the user denies the consent screen.
    """
    print(error)  # TODO: store error in log
    return render_template('login.html')


# Error handler for InvalidClientIdError
@app.errorhandler(InvalidClientIdError)
def handle_invalid_client_error(error):
    """
    Error handler for InvalidClientIdError with redirect to login page.
    - As this error is raised when the client ID is invalid.
    """
    print(error)  # TODO: store error in log
    return render_template('login.html')


# Routes
@app.route('/')
def login():
    """
    Login page view
    - Login page with redirect to Google Sign-In page button
    """
    return render_template('login.html')


@app.route('/logout')
def logout():
    """
    Logout page view
    - Clear the session and redirect to login page
    """
    session.clear()
    flash('You were logged out.')
    return render_template('login.html')


@app.route('/auth')
def auth():
    """
    Authentication SSO with Google Sign-In using the oauthlib library
    - Redirect to Google Sign-In page
    """
    return redirect(location=REQ_URI)


@app.route('/home')
def home():
    """
    Home page view - Redirect after Google login & consent screen
    User info is fetched from Google API
    Project data is fetched from Severa API
    """
    code = request.args.get('code')

    # Generate URL to generate token
    token_url, headers, body = CLIENT.prepare_token_request(
        GOOGLE_AUTH_URL_DICT['token_gen'],
        authorisation_response=request.url if LOCALHOST_MODE else request.url.replace('http', 'https'),
        redirect_url=request.base_url if LOCALHOST_MODE else request.base_url.replace('http', 'https'),
        code=code)

    # Generate token to access Google API
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(CLIENT_ID, CLIENT_SECRET))

    # Parse the token response
    CLIENT.parse_request_body_response(json.dumps(token_response.json()))

    uri, headers, body = CLIENT.add_token(GOOGLE_AUTH_URL_DICT['get_user_info'])

    # Get the user info
    response_user_info = requests.get(url=uri,
                                      headers=headers,
                                      data=body)
    info = response_user_info.json()

    # get user email address:
    if LOCALHOST_MODE:
        user_email = 'wenche.falstad@visma.com'  # TODO: Remove this in production (it's for testing purposes only)
        # user_email = 'ruben.sivananthan@visma.com'  # TODO: Remove this in production (it's for testing purposes only)
    else:
        user_email = info['email']

    user_name = user_email.split('@')[0]

    # Fetch project-related data:
    severa = SeveraApiHandler()
    user_guid = severa.get_user_guid(email=user_email)
    project_data = severa.get_user_projects(user_guid=user_guid)
    project_data = [i for i in project_data if i['expectedValue']['amount'] and i['expectedValue']['amount'] > 20000]
    mappings = get_dep_emp_mapping()

    # get period info:
    period_info = __get_period_info()
    year = int(period_info.get('year'))
    period_idx = int(period_info.get('period_index'))
    period_name = period_info.get('period_name')
    period_start_ts = period_info.get('period_start_ts')
    period_end_ts = period_info.get('period_end_ts')

    # get already edited projects:
    bq = BigQueryHandler()
    edited_projects = bq.get_already_edited_pids(period=period_idx,
                                                 year=year,
                                                 reporter=user_email)
    # get hidden projects IDs:
    hidden_project_ids = bq.get_hidden_projects(reporter=user_email)

    # Render home page
    return render_template('home.html',
                           user_email=user_email,
                           user_name=user_name,
                           project_data=project_data,
                           edited_projects=edited_projects,
                           mappings=mappings,
                           period_name=period_name,
                           period_idx=period_idx,
                           year=year,
                           period_start_ts=period_start_ts,
                           period_end_ts=period_end_ts,
                           hidden_project_ids=hidden_project_ids)


@app.route("/edit_project/<pid>/", methods=["POST"])
def edit_project(pid):
    """
    Ajax call to get the workhours for a specific project in order to edit project data
    for the periodisation process.
    :param pid: project number in Severa
    """
    # get data from the request
    data = request.get_json()
    guid = data.get('guid')
    contract_value = data.get('contract_value')
    currency = data.get('currency')
    period_idx = int(data.get('per_idx'))
    year = int(data.get('year'))
    period_start = float(data.get('period_start_ts'))
    period_end = float(data.get('period_end_ts'))

    token = get_token('SEVERA_ACCESS_TOKEN')
    refresh_token = get_token('SEVERA_REFRESH_TOKEN')
    bq = BigQueryHandler()
    severa = SeveraApiHandler(token=token,
                              refresh_token=refresh_token)

    project_workhours = severa.get_project_workhours(project_guid=guid)
    project_workhours = [i for i in project_workhours if i.get('isApproved') is True]  # use only approved hours
    worktypes = severa.get_project_worktypes(project_guid=guid)

    finance_data = get_finance_data(severa_pid=pid)

    # adjust worktypes - get only code and name (other values are not needed for the frontend)
    worktypes = [{'code': i.get('worktype').get('code'), 'name': i.get('worktype').get('name')} for i in worktypes]

    # according to RPA-4248 requirement, we need to merge worktypes with finance data
    for k, v in finance_data.items():
        if k not in [i['code'] for i in worktypes]:
            worktypes.append({'code': k, 'name': v.get('description')})

    allocation = bq.get_allocation(pid=pid)
    pp_history_data = bq.get_periodisation(pid=pid,
                                           period=period_idx,
                                           year=year)

    # get only period workhours (defined by period start and end timestamps)
    period_workhours = [i for i in project_workhours if
                        period_start <= datetime.fromisoformat(i.get('createdDateTime')).timestamp() <= period_end]

    return jsonify({'htmlresponse': render_template('edit.html',
                                                    project_workhours=project_workhours,
                                                    guid=guid,
                                                    period_workhours=period_workhours,
                                                    worktypes=worktypes,
                                                    finance_data=finance_data,
                                                    pid=pid,
                                                    allocation=allocation,
                                                    pp_history_data=pp_history_data,
                                                    contract_value=contract_value,
                                                    currency=currency)})


@app.route("/set_periodisation/<pid>/", methods=["POST"])
def set_periodisation(pid):
    """
    Ajax call to set the periodisation for a specific project.
    :param pid: project number in Severa
    :return:
    """

    # get data from the request
    data = request.get_json()
    guid = data.get('guid')
    user_email = data.get('user_email')
    pp_data = data.get('pp_data')
    period_idx = int(data.get('per_idx'))
    mappings = eval(data.get('mappings'))
    date = datetime.now().strftime("%Y-%m-%d")

    try:
        for row in pp_data:
            row['Date'] = date
            row['Year'] = date.split('-')[0]
            row['Period'] = period_idx
            row['Created'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            _revenue = float(row['Inntekt denne måneden'].split()[0]) if row['Inntekt denne måneden'] else 0
            _currency = row['Inntekt denne måneden'].split()[1] if len(
                row['Inntekt denne måneden'].split()) > 1 else 'NOK'

            row['Amount'] = _revenue
            row['Currency'] = _currency

            _is_tech = True if 'teknisk' in row['Arbeidstype'].lower() else False
            _id = row['Produkt'][:3]
            _suffix = row['Produkt'][3:5]
            _employee = 0
            _department = 0

            if _id in mappings.keys():
                for i in mappings[_id]:
                    if _is_tech:
                        if 'teknisk' in i['Description'].lower():
                            _employee = i.get('Employee') if _suffix == i['Product suffix'] else _employee
                            _department = i.get('Department') if _suffix == i['Product suffix'] else _department
                    else:
                        if 'teknisk' not in i['Description'].lower():
                            _employee = i.get('Employee') if _suffix == i['Product suffix'] else _employee
                            _department = i.get('Department') if _suffix == i['Product suffix'] else _department
            else:
                pass
                # missing mapping - default value will be used which is 0

            row['Employee'] = _employee
            row['Department'] = _department

            """
            NOTE: Rules for periodisation: RPA-4089 (Jira ticket)
            """

            if _revenue <= 0:
                row['Debet'] = 3501 if row['Produkt'][-1] == '6' else 3500
                row['Credit'] = 2965
            else:
                row['Debet'] = 1530
                row['Credit'] = 3501 if row['Produkt'][-1] == '6' else 3500

        # set periodisation data to BigQuery
        BigQueryHandler().set_periodisation(pid=pid,
                                            pp_data=pp_data,
                                            reporter=user_email)

        return jsonify({'htmlresponse': render_template('submit.html',
                                                        guid=guid,
                                                        pid=pid,
                                                        pp_data=pp_data,
                                                        error=None)})
    except Exception as error:
        return jsonify({'htmlresponse': render_template('submit.html',
                                                        guid=guid,
                                                        pid=pid,
                                                        pp_data=pp_data,
                                                        error=error)})


@app.route("/confirm_hide/<pid>/", methods=["POST"])
def set_as_hidden(pid):
    """
    Ajax call to hide a specific project.
    :param pid:
    :return:
    """
    # get data from the request
    data = request.get_json()
    user_email = data.get('user_email')

    bq = BigQueryHandler()
    bq.hide_project(pid=pid,
                    reporter=user_email)

    return jsonify({'htmlresponse': render_template('modal_confirm_hide.html',
                                                    pid=pid,
                                                    user_email=user_email)})


@app.route("/confirm_unhide/<pid>/", methods=["POST"])
def set_as_visible(pid):
    """
    Ajax call to unhide a specific project.
    :param pid:
    :return:
    """
    # get data from the request
    data = request.get_json()
    user_email = data.get('user_email')

    bq = BigQueryHandler()
    bq.unhide_project(pid=pid,
                      reporter=user_email)

    return jsonify({'htmlresponse': render_template('modal_confirm_unhide.html',
                                                    pid=pid,
                                                    user_email=user_email)})


# Run the app
if __name__ == '__main__':
    app.run(debug=True, port=8443, host='0.0.0.0')
