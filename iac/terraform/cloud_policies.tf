
data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_iam_member" "cloudbuild_run_policy" {
  depends_on = [
    google_service_account.cloudbuild_service_account
  ]
  project = var.project_id
  role = "roles/run.admin"
  member = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_build_policy" {
  depends_on = [
    google_service_account.cloudbuild_service_account
  ]
  project = var.project_id
  role = "roles/cloudbuild.workerPoolUser"
  member = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_service_account_policy" {
  depends_on = [
    google_service_account.cloudbuild_service_account
  ]
  project = var.project_id
  role = "roles/iam.serviceAccountUser"
  member = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}