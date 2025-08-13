from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import uuid
from jinja2 import Template
import smtplib
from email.message import EmailMessage
import boto3
import json
import traceback
import requests  # to download PDF from S3 URL

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Local in-memory course storage
courses = {}

# AWS Configuration
AWS_REGION = 'us-west-1'  # Match your Lambda region
S3_BUCKET = 'certificate-pdf-storage'  # <-- Your exact S3 bucket name
LAMBDA_FUNCTION = 'GenerateCertificatePDF'

# AWS Clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
cert_table = dynamodb.Table('Certificates')
lambda_client = boto3.client('lambda', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)


@app.route('/create-course', methods=['POST'])
def create_course():
    course_id = f"COURSE-{str(uuid.uuid4())[:8]}"
    course_name = request.form.get('course')
    institution = request.form.get('institution')
    duration = request.form.get('duration')
    signer = request.form.get('signer')
    logo = request.files.get('logo')

    if not logo:
        return jsonify({'error': 'Logo file is required'}), 400

    logo_path = os.path.join(UPLOAD_FOLDER, f"{course_id}_logo.png")
    logo.save(logo_path)

    courses[course_id] = {
        'course': course_name,
        'institution': institution,
        'duration': duration,
        'signer': signer,
        'logo_path': logo_path,
        'created_at': datetime.now().strftime("%d %B %Y")
    }

    return jsonify({'course_id': course_id}), 200


@app.route('/generate-certificate', methods=['POST'])
def generate_certificate():
    try:
        data = request.json
        name = data['name']
        email = data['email']
        course_id = data['course_id']

        if course_id not in courses:
            return jsonify({'error': 'Course not found'}), 404

        cert_id = f"CERT-{str(uuid.uuid4())[:8]}"
        course_info = courses[course_id]

        html_data = {
            'cert_id': cert_id,
            'student_name': name,
            'course': course_info['course'],
            'institution': course_info['institution'],
            'duration': course_info['duration'],
            'signer': course_info['signer'],
            'date': course_info['created_at'],
            'logo_path': 'file:///' + os.path.abspath(course_info['logo_path']).replace('\\', '/')
        }

        # Render HTML template locally
        with open('certificate_template.html') as f:
            template = Template(f.read())
        html = template.render(**html_data)

        # IMPORTANT: Match keys expected by Lambda function
        lambda_payload = {
            "html_content": html,
            "file_name": f"{name.replace(' ', '_')}_{cert_id}.pdf"
        }

        lambda_response = lambda_client.invoke(
            FunctionName=LAMBDA_FUNCTION,
            InvocationType='RequestResponse',
            Payload=json.dumps(lambda_payload)
        )

        lambda_result_raw = lambda_response['Payload'].read()
        lambda_result = json.loads(lambda_result_raw)

        if lambda_result.get("statusCode") != 200:
            return jsonify({'error': 'PDF generation failed', 'details': lambda_result}), 500

        body_json = json.loads(lambda_result.get("body", "{}"))
        s3_url = body_json.get("pdf_url")
        s3_key = body_json.get("s3_key")  # Make sure your Lambda returns this if possible

        if not s3_url:
            return jsonify({'error': 'Lambda did not return S3 URL'}), 500

        # Download PDF bytes from S3 URL (optional if you want to email)
        pdf_response = requests.get(s3_url)
        if pdf_response.status_code != 200:
            return jsonify({'error': 'Failed to download PDF from S3'}), 500
        pdf_bytes = pdf_response.content

        # Store certificate info in DynamoDB with s3_key
        cert_table.put_item(
            Item={
                'cert_id': cert_id,
                'name': name,
                'email': email,
                'course': course_info['course'],
                'date': course_info['created_at'],
                'pdf_url': s3_url,
                's3_key': s3_key if s3_key else s3_url.split('/')[-1]  # fallback to filename if no s3_key returned
            }
        )

        # Send certificate email with PDF attached
        send_certificate_email(email, pdf_bytes, filename=f"{name.replace(' ', '_')}_{cert_id}.pdf")

        return jsonify({
            'message': f'Certificate sent to {email}',
            'cert_id': cert_id,
            'url': s3_url
        }), 200

    except Exception as e:
        error_text = traceback.format_exc()
        print(error_text)
        return jsonify({'error': str(e)}), 500


def send_certificate_email(to_email, pdf_bytes, filename):
    EMAIL = "rumanamubarak25@gmail.com"
    PASSWORD = "zbglafpjqgdwbooi"

    msg = EmailMessage()
    msg['Subject'] = "Your Certificate"
    msg['From'] = EMAIL
    msg['To'] = to_email
    msg.set_content("Congratulations! Please find your certificate attached.")

    msg.add_attachment(pdf_bytes, maintype='application', subtype='pdf', filename=filename)

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(EMAIL, PASSWORD)
        smtp.send_message(msg)


@app.route('/api/verify/<cert_id>', methods=['GET'])
def api_verify_certificate(cert_id):
    try:
        response = cert_table.get_item(Key={'cert_id': cert_id}, ConsistentRead=True)
        cert = response.get('Item')
        if not cert:
            return jsonify({'valid': False, 'message': 'Certificate not found'}), 404

        pdf_url = cert.get('pdf_url')
        s3_key = cert.get('s3_key') or (pdf_url.split('/')[-1] if pdf_url else None)

        # If pdf_url missing or expired, generate presigned URL for longer duration (e.g. 7 days)
        if not pdf_url or not pdf_url.startswith('http'):
            if not s3_key:
                return jsonify({'valid': False, 'message': 'No certificate PDF available'}), 404

            pdf_url = s3_client.generate_presigned_url(
                ClientMethod='get_object',
                Params={'Bucket': S3_BUCKET, 'Key': s3_key},
                ExpiresIn=3600 * 24 * 7  # 7 days expiration
            )

        return jsonify({
            'valid': True,
            'course': cert.get('course') or cert.get('course_name'),
            'date': cert.get('date') or cert.get('issue_date'),
            'pdf_url': pdf_url
        })

    except Exception as e:
        error_text = traceback.format_exc()
        print(error_text)
        return jsonify({'valid': False, 'message': f'Error: {str(e)}'}), 500



if __name__ == '__main__':
    app.run(port=5000, debug=True)


