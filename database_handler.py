"""
Database handler

1) VDL (Visma Data Lake) - BigQuery - financial data storage
2) PP (Project Periodisation) BQ - BigQuery - allocation and periodisation data storage

"""

import os
import json
from datetime import datetime
from google.cloud import bigquery
from google.oauth2 import service_account
from dotenv import load_dotenv
from config import LOCALHOST_MODE


if LOCALHOST_MODE:
    load_dotenv()
    vdl_creds_json = os.getenv('VDL_CREDS_FILE')
    pp_bq_creds_json = os.getenv('BQ_TEST_CREDS_FILE')
else:
    with open('./secrets/VDL_CREDS_FILE/VDL_CREDS_FILE', 'r') as f:
        vdl_creds_json = f.read()
    with open('./secrets/BQ_TEST_CREDS_FILE/BQ_TEST_CREDS_FILE', 'r') as f:
        pp_bq_creds_json = f.read()


def get_finance_data(severa_pid):
    """
    Get data from VDL for specified project based on the severa project id (severa_pid param).
    :param severa_pid: Severa project ID (column is called R2 in Visma DataLake).
    :return: project data as dict {severa_pid_as_str: booked_value_as_float}
    :rtype: dict
    """
    credentials = service_account.Credentials.from_service_account_info(json.loads(vdl_creds_json))
    database = 'ENNO_VismaBusiness'
    revenue_table = 'ProdTr'

    client = bigquery.Client(credentials=credentials,
                             project=credentials.project_id)

    query = f"SELECT ProdNo, Descr, sum(p.Am) as booked " \
            f"FROM `{credentials.project_id}.{database}.{revenue_table}` AS p " \
            f"WHERE p.R2 = {severa_pid} " \
            f"group by ProdNo, Descr"

    query_job = client.query(query)
    result = [dict(row.items()) for row in query_job.result()]
    return {i['ProdNo']: {'booked': i['booked'], 'description': i['Descr']} for i in result}


class BigQueryHandler:
    def __init__(self):
        self.credentials = service_account.Credentials.from_service_account_info(json.loads(pp_bq_creds_json))
        # TODO: fetch credentials from GCP secret manager instead of .env file
        self.database = 'pp_database'
        self.client = bigquery.Client(credentials=self.credentials,
                                      project=self.credentials.project_id)

    def get_allocation(self, pid, worktype=None):
        """
        Get allocation data for the project from BQ pp_database - allocation table.
        :param pid: Severa project ID
        :param worktype: Severa work type code
        :return: allocation data as dict {worktype_as_str: allocation_as_float}
        :rtype: dict
        """
        if worktype:
            query = f"SELECT * " \
                    f"FROM `{self.credentials.project_id}.{self.database}.allocation` " \
                    f"WHERE project_number = {pid} AND product = {worktype}"
        else:
            query = f"SELECT * " \
                    f"FROM `{self.credentials.project_id}.{self.database}.allocation` " \
                    f"WHERE project_number = {pid}"

        query_job = self.client.query(query)
        result = [dict(row.items()) for row in query_job.result()]
        return {str(i['product']): i['allocation'] for i in result}

    def set_allocation(self, pid, worktype, allocation):
        """
        Insert/update allocation data to pp_database - allocation table.
        NOTE: If allocation data for specific project and worktype already exists, update it.
        :param pid: Severa project ID
        :param worktype: Severa work type code
        :param allocation: Allocation value (it's called Allocated Value in UI - from user input)
        :return: True if allocation data was inserted successfully, False otherwise
        :rtype: bool
        """
        if not self.get_allocation(pid=pid, worktype=worktype):
            query = f"INSERT INTO `{self.credentials.project_id}.{self.database}.allocation` " \
                    f"VALUES ({pid}, {worktype}, {allocation}, TIMESTAMP(CURRENT_TIMESTAMP))"
        else:
            query = f"UPDATE `{self.credentials.project_id}.{self.database}.allocation` " \
                    f"SET allocation = {allocation} " \
                    f"WHERE project_number = {pid} AND product = {worktype}"

        query_job = self.client.query(query)
        print(f"Allocation query job: {query_job}")
        query_job.result()
        print(f"Allocation query job result: {query_job.result()}")
        if query_job.errors:
            pass  # TODO: add error handling
            print(f"Allocation query job errors: {query_job.errors}")

    def set_bulk_allocation(self, pid, pp_data: list):
        """
        Use 'Allocated Value' input field value from pp_data to set allocation for specific project in our BQ table.
        We're using 'Allocated value' field instead of 'Allocation' because percentage allocation is calculated
        field and also rounded, so it might cause problems with the calculations (periodic numbers etc..).
        Allocated value - user inputted amount of money allocated for the work type in the specific project.
        "Bulk" insert/update allocation data to pp_database - allocation table.
        ------------------------------------------------------------------------
        NOTE - IMPORTANT: pp_data is combined data from UI which has norwegian fields in it, so this is why there is a
        mix of norwegian and english fields in the pp_data.
        ------------------------------------------------------------------------
        :param pid: Severa project ID
        :param pp_data: periodisation data as dict structured like {worktype: product_data_dict}
        :return: True if allocation data was inserted successfully, False otherwise
        :rtype: bool
        """
        if not self.get_allocation(pid=pid):
            # Bulk insert:
            _values = [str((int(pid),
                            int(i.get('Produkt')),
                            float(i.get('Tildelt verdi').split()[0]),
                            "TIMESTAMP(CURRENT_TIMESTAMP())")).replace(
                                                                    "'TIMESTAMP(CURRENT_TIMESTAMP())'",
                                                                    "TIMESTAMP(CURRENT_TIMESTAMP())") for i in pp_data]

            query = f"INSERT INTO `{self.credentials.project_id}.{self.database}.allocation` " \
                    f"VALUES {','.join([str(i) for i in _values])}"

        else:
            # Bulk update:
            _select = [f"SELECT {pid} AS project_number, " \
                       f"{i.get('Produkt')} AS product, " \
                       f"{i.get('Tildelt verdi').split()[0]} AS allocation{' UNION ALL ' if idx != len(pp_data) - 1 else ''}"
                       for idx, i in enumerate(pp_data)]

            query = f"MERGE INTO `{self.credentials.project_id}.{self.database}.allocation` AS target " \
                    f"USING ({''.join(_select)}) AS source " \
                    f"ON target.project_number = source.project_number " \
                    f"AND target.product = source.product " \
                    f"WHEN MATCHED THEN UPDATE SET target.allocation = source.allocation;"

        # Try bulk insert/update, if fails, set allocation row by row:
        try:
            query_job = self.client.query(query)
            query_job.result()

        except Exception as error:
            # TODO: do something with the error (log or raise exception)
            pass
            # set allocation row by row as a fallback:
            for row in pp_data:
                self.set_allocation(pid=pid,
                                    worktype=row.get('Produkt'),
                                    allocation=row.get('Tildelt verdi').split()[0])

    def get_periodisation(self, period, year, pid=None, reporter=None):
        """
        Get periodisation data for specific project and period from BQ pp_database - periodisation table.
        :param period: Period number (1-12) <type: integer>
        :param year: Year (YYYY) <type: integer>
        :param pid: Severa project ID
        :param reporter: User (Project manager) email address
        :return: periodisation data as dict structured like {worktype: product_data_dict}
        :rtype: dict
        """
        if pid:
            query = f"SELECT * " \
                    f"FROM `{self.credentials.project_id}.{self.database}.periodisation` " \
                    f"WHERE project_number = {pid} AND period = {period} AND year = {year}"
        else:
            query = f"SELECT * " \
                    f"FROM `{self.credentials.project_id}.{self.database}.periodisation` " \
                    f"WHERE period = {period} AND year = {year} AND reporter = '{reporter}'"

        query_job = self.client.query(query)
        result = [dict(row.items()) for row in query_job.result()]
        return {str(i['product']): i for i in result}

    def set_periodisation(self, pid, pp_data: list, reporter: str):
        """
        Set periodisation for current period to pp_database - periodisation table.
        ------------------------------------------------------------------------
        NOTE - IMPORTANT: pp_data is combined data from UI which has norwegian fields in it, so this is why there is a
        mix of norwegian and english fields in the pp_data.
        ------------------------------------------------------------------------
        :param pid: Severa project ID
        :param pp_data: project periodisation data
        :param reporter: User (Project manager) email address
        :return: True if periodisation data was inserted successfully, False otherwise
        :rtype: bool
        """
        year, period = datetime.now().strftime("%Y-%m").split('-')

        if not self.get_periodisation(pid=pid, period=int(period), year=int(year)):
            # 1) Insert periodisation if there is no data for the current period

            _values = [str((int(pid),
                            int(i.get('Produkt')),  # Product
                            f"{i.get('Date')}",
                            int(i.get('Year')),
                            int(i.get('Period')),
                            int(i.get('Debet')),
                            int(i.get('Credit')),
                            int(i.get('Employee')),
                            int(i.get('Department')),
                            float(i.get('Inntekt denne måneden').split()[0]),  # Revenue this month
                            f"{i.get('Created')}",
                            reporter,
                            int(0),
                            f"GENERATE_UUID()")).replace("'GENERATE_UUID()'", "GENERATE_UUID()") for i in
                       pp_data]

            query = f"INSERT INTO `{self.credentials.project_id}.{self.database}.periodisation` " \
                    f"(project_number, product, date, year, period, debet, credit, " \
                    f"employee, department, amount, created, reporter, vb_flag, uuid) " \
                    f"VALUES {','.join([str(i) for i in _values])}"

            query_job = self.client.query(query)
            query_job.result()
            if query_job.errors:
                pass  # TODO: add error handling

        else:
            # 2) Update periodisation if there is data already in place for current period

            _select = [f"SELECT {pid} AS project_number, " \
                       f"{i.get('Produkt')} AS product, " \
                       f"{i.get('Period')} AS period, " \
                       f"{i.get('Year')} AS year, " \
                       f"{i.get('Debet')} AS debet, " \
                       f"{i.get('Credit')} AS credit, " \
                       f"{i.get('Inntekt denne måneden').split()[0]} AS amount, " \
                       f"DATETIME '{i.get('Created')}' AS created{' UNION ALL ' if idx != len(pp_data) - 1 else ''}"
                       for idx, i in enumerate(pp_data)]

            query = f"MERGE INTO `{self.credentials.project_id}.{self.database}.periodisation` AS target " \
                    f"USING ({''.join(_select)}) AS source " \
                    f"ON target.project_number = source.project_number " \
                    f"AND target.product = source.product " \
                    f"AND target.period = source.period " \
                    f"AND target.year = source.year " \
                    f"WHEN MATCHED THEN UPDATE SET " \
                    f"target.credit = source.credit, " \
                    f"target.debet = source.debet, " \
                    f"target.amount = source.amount, " \
                    f"target.created = source.created;"

            # try bulk update, if fails, update periodisation row by row:
            try:
                query_job = self.client.query(query)
                query_job.result()

            except Exception as error:
                # update periodisation row by row as a fallback:
                for row in pp_data:
                    query = f"UPDATE `{self.credentials.project_id}.{self.database}.periodisation` " \
                            f"SET debet = {row.get('Debet')}, " \
                            f"credit = {row.get('Credit')}, " \
                            f"amount = {row.get('Inntekt denne måneden').split()[0]}, " \
                            f"created = DATETIME '{row.get('Created')}' " \
                            f"WHERE project_number = {pid} " \
                            f"AND product = {row.get('Produkt')} " \
                            f"AND year = {row.get('Year')} " \
                            f"AND period = {row.get('Period')}"

                    query_job = self.client.query(query)
                    query_job.result()
                    if query_job.errors:
                        pass  # TODO: add error handling

        # 3) Set allocation (or update allocation if exists)
        self.set_bulk_allocation(pid=pid, pp_data=pp_data)

    def get_already_edited_pids(self, period: int, year: int, reporter: str):
        """
        Get distinct project numbers for already edited periodisation data for specific period and year.
        :param period: Period number (1-12) <type: integer>
        :param year: Year (YYYY) <type: integer>
        :param reporter: User (Project manager) email address <type: string>
        :return: list of already edited project numbers
        :rtype: list
        """
        query = f"SELECT DISTINCT project_number " \
                f"FROM `{self.credentials.project_id}.{self.database}.periodisation` " \
                f"WHERE period = {period} AND year = {year} AND reporter = '{reporter}'"

        query_job = self.client.query(query)
        result = [dict(row.items()).get('project_number') for row in query_job.result()]
        return result

    def get_hidden_projects(self, reporter: str):
        """
        Get hidden projects for specific user.
        :param reporter: User (Project manager) email address <type: string>
        :return: list of hidden project numbers
        :rtype: list
        """
        query = f"SELECT DISTINCT project_number " \
                f"FROM `{self.credentials.project_id}.{self.database}.hidden_projects` " \
                f"WHERE project_owner = '{reporter}'"

        query_job = self.client.query(query)
        result = [dict(row.items()).get('project_number') for row in query_job.result()]
        return result

    def hide_project(self, pid, reporter):
        """
        Hide project for specific user.
        :param pid: Severa project ID
        :param reporter: User (Project manager) email address <type: string>
        :return: True if project was hidden successfully, False otherwise
        :rtype: bool
        """
        query = f"INSERT INTO `{self.credentials.project_id}.{self.database}.hidden_projects` " \
                f"VALUES ({pid}, '{reporter}', CURRENT_DATETIME())"
        try:
            query_job = self.client.query(query)
            query_job.result()
            return True

        except Exception as error:
            return False # TODO: add error handling


    def unhide_project(self, pid, reporter):
        """
        Set project visible for specific user.
        :param pid: Severa project ID
        :param reporter: User (Project manager) email address <type: string>
        :return: True if project was set visible successfully, False otherwise
        :rtype: bool
        """
        query = f"DELETE FROM `{self.credentials.project_id}.{self.database}.hidden_projects` " \
                f"WHERE project_number = {pid} AND project_owner = '{reporter}'"
        try:
            query_job = self.client.query(query)
            query_job.result()
            return True

        except Exception as error:
            return False  # TODO: add error handling
