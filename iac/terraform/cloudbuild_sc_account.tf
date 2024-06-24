resource "google_service_account" "cloudbuild_service_account" {
  account_id = "cloud-build-sc-account"
}

resource "google_project_iam_member" "service_acc" {
  depends_on = [
    google_service_account.cloudbuild_service_account
  ]
  project = var.project_id
  role = "roles/iam.serviceAccountUser"
  member = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "logs_writer" {
  depends_on = [
    google_service_account.cloudbuild_service_account
  ]
  project = var.project_id
  role = "roles/logging.logWriter"
  member = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "cloud_run_admin_policy" {
  depends_on = [
    google_service_account.cloudbuild_service_account
  ]
  project = var.project_id
  role = "roles/run.admin"
  member = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "secret_accessor_policy" {
  depends_on = [
    google_service_account.cloudbuild_service_account
  ]
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "cloud_build_editor" {
  project =var.project_id
  role    = "roles/cloudbuild.builds.editor"
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "cloud_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}