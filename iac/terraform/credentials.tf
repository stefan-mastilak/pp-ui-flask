provider "google" {
  project = var.project_id
  region  = var.region
  credentials = "../credentials/credentials_tf_test.json"
}

variable "secrets" {
  description = "Map of secret names and their values."
  type        = map(string)
  default = {
    "SEVERA_CLIENT_ID" = "var1"
    "SEVERA_CLIENT_SECRET" = "var1"
    "SEVERA_API_URL" = "var1"
    "SEVERA_SCOPE" = "var1"
    "GCP_CLIENT_ID_TEST" = "var1"
    "GCP_CLIENT_SECRET_TEST" = "var1"
    "SVC_ACC_USER" = "var1"
    "SVC_ACC_PWD" = "var1"
    "REDIRECT_URI_TEST" = "var1"
  }
}

variable "secrets_from_file" {
  description = "Map of secret names and their values."
  type        = map(string)
  default = {
    "BQ_TEST_CREDS_FILE" = "../credentials/bq_creds_test.json"
    "GS_API_CREDS_TEST" = "../credentials/sheets_api_creds_test.json"
    "MAPPING_SPREADSHEET_TOKEN_TEST" = "../credentials/mapping_sheet_token_test.json"
    "VDL_CREDS_FILE" = "../credentials/vdl_creds.json"
    "CLOUD_BUILD_SC_ACC" = "../credentials/cloud_build_sc_acc_creds.json"
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each = merge(var.secrets, var.secrets_from_file)
  secret_id = each.key
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "secrets" {
  for_each = var.secrets
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value
}

resource "google_secret_manager_secret_version" "file_secrets" {
  for_each = var.secrets_from_file
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = file(var.secrets_from_file[each.key])
}