# Digital Certificate Generator & Verifier

A cloud-based web application that automates the generation, distribution, and verification of digital certificates. Designed for educational institutions, training centers, and online course providers, the system is built using a modern tech stack with scalability and security in mind.

## 🚀 Features

- Institution dashboard for course management
- Student registration form
- Auto-generation of certificates with unique UUIDs
- Cloud storage using AWS S3
- Verification through a unique certificate ID
- Email dispatch with certificate attachments or links
- Secure data storage using Amazon DynamoDB

## 🛠️ Tech Stack

- **Frontend**: React.js, HTML, CSS
- **Backend**: Flask (Python)
- **Database**: Amazon DynamoDB
- **File Storage**: AWS S3
- **Email Service**: SMTP 

## 📌 API Endpoints

- `POST /create-certificate`: Accepts form data, generates certificate, uploads to S3, stores metadata in DynamoDB.
- `GET /verify/<certificate_id>`: Verifies certificate authenticity by fetching data from DynamoDB.

## 📷 Screenshots

> Add screenshots of Institution dashboard, student form, generated certificate, and verification page here.

## ✅ How It Works

1. Institution enters course details and uploads signature/logo.
2. Students fill the form to register.
3. Backend generates certificates and stores them in S3.
4. Metadata is saved to DynamoDB.
5. Verification via ID is handled through the `/verify` endpoint.


