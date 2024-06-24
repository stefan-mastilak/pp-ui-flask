// Enabled API's

// enable iam api
resource "google_project_service" "developers_console_enable_api" {
  project                    = var.project_id
  service                    = "iam.googleapis.com"
  disable_dependent_services = false
  disable_on_destroy         = false
}

// enable google compute engine api
resource "google_project_service" "cloud_compute_engine_enable_api" {
  project                    = var.project_id
  service                    = "compute.googleapis.com"
  disable_dependent_services = false
  disable_on_destroy         = false
}

// enable secret manager api for storing secrets
resource "google_project_service" "secret_manager_enable_api" {
  project                    = var.project_id
  service                    = "secretmanager.googleapis.com"
  disable_dependent_services = false
  disable_on_destroy         = false
}

// enable cloud build api
resource "google_project_service" "cloudbuild_api" {
   project                    = var.project_id
   service                    = "cloudbuild.googleapis.com"
   disable_dependent_services = false
   disable_on_destroy         = false
}

// enable cloud run api in cloud build
resource "google_project_service" "cloud_run_admin_enable_api" {
  project                    = var.project_id
  service                    = "run.googleapis.com"
  disable_dependent_services = false
  disable_on_destroy         = false
}