
# Project Periodisation <br>(Flask User Interface)

## IAC:
Terraform, Docker

* <code>./iac/credentials</code> - BQ, VDL, Gsheets and other credentials stored here
* <code>./iac/terraform</code> - terraform scripts for cloud run, cloud build, secret manager, iam api, etc.  
</code>
* Branches
  * <code>main</code> (CICD trigger to prod-proje-cm) - not implemented yet
  * <code>test</code> (CICD trigger to test-proje-cm) - implemented


## Hosting:
* Google Cloud Platform
    * Cloud Run running Flask 
      * URL Test: https://pp-ui-app-kimeiliztq-ew.a.run.app/
      * URL Prod: not implemented yet

## User Authentication
* Google OAuth 2.0
* Enabled for Visma domain (@visma.com) users only

## Storage:
* BigQuery
* Enviroments: test and prod 
* database: <code>pp_database</code>
  * tables:
    * <code>allocation</code> - storing allocated amount of money for project and its worktypes
    * <code>periodisation</code> - storing periodisation data
    * <code>hidden_projects</code> - (helper table) storing hidden projects by the user 

## Mappings
* Mappings are stored in a Google [spreadsheet](https://docs.google.com/spreadsheets/d/1yNzntfyhfPNls7inR1oiOlzKVa7mriFuWmaFz_eOh_M/edit?pli=1#gid=34000011)
* Mappings are fetched by the app and stored in memory
* Mappings are used to map department and employee code (dep_emp_mapping spreadsheet) and financial calendar (periods spreadsheet)

## Project structure
* <code>./iac</code>
  * <code>credentials</code> - excluded from git
  * <code>terraform</code> - terraform scripts
* <code>./static</code>
  * <code>images</code> - logos and images
  * <code>js</code> - javascript code
  * <code>styles</code> - css stylesheet 
* <code>./templates</code> - html templates 
* <code>./tests</code> - tests
* <code>app.py</code>
* <code>cloudbuild.yaml</code>
* <code>app.py</code> - main script containing flask routes 
* <code>config.py</code> - config for app settings
* <code>database_handler.py</code> - DB handler for PP BQ and VDL BQ databases
* <code>Dockerfile</code> - Docker container config
* <code>mappings_handler.py</code> - Handler for fetching data from [spreadsheet](https://docs.google.com/spreadsheets/d/1yNzntfyhfPNls7inR1oiOlzKVa7mriFuWmaFz_eOh_M/edit?pli=1#gid=34000011) containing department, employee code and financial calendar mappings
* <code>README.md</code> Readme file
* <code>requirements.txt</code> - python env requirements list
* <code>severa_handler.py</code> - Severa API handler