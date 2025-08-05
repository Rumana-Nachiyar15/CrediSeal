from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import uuid
from jinja2 import Template
import pdfkit
import smtplib
from email.message import EmailMessage
import boto3

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Local in-memory course storage
courses = {}

# AWS Configuration
AWS_REGION = 'us-east-1'
S3_BUCKET = 'certificates-storage-rumana'

# AWS Clients
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
cert_table = dynamodb.Table('Certificates')
s3 = boto3.client('s3', region_name=AWS_REGION)

@app.route('/create-course', methods=['POST'])
def create_course():
    course_id = f"COURSE-{str(uuid.uuid4())[:8]}"
    course_name = request.form.get('course')
    institution = request.form.get('institution')
    duration = request.form.get('duration')
    signer = request.form.get('signer')
    logo = request.files.get('logo')

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

    with open('certificate_template.html') as f:
        template = Template(f.read())
    html = template.render(**html_data)

    output_filename = f"{name.replace(' ', '_')}_{cert_id}.pdf"
    local_pdf_path = os.path.join(UPLOAD_FOLDER, output_filename)

    config = pdfkit.configuration(wkhtmltopdf='C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe')
    options = {'enable-local-file-access': None}
    pdfkit.from_string(html, local_pdf_path, configuration=config, options=options)

    # ✅ Upload to S3 WITHOUT ACL (since ACLs are disabled)
    s3.upload_file(local_pdf_path, S3_BUCKET, output_filename)

    # ✅ Generate pre-signed URL (1 hour validity)
    s3_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': S3_BUCKET, 'Key': output_filename},
        ExpiresIn=3600
    )

    # ✅ Save to DynamoDB
    cert_table.put_item(
        Item={
            'cert_id': cert_id,
            'name': name,
            'email': email,
            'course': course_info['course'],
            'date': course_info['created_at'],
            'pdf_url': s3_url
        }
    )

    # ✅ Email with attachment
    send_certificate_email(email, local_pdf_path)

    # ✅ Clean up local file
    os.remove(local_pdf_path)

    return jsonify({
        'message': f'Certificate sent to {email}',
        'cert_id': cert_id,
        'url': s3_url
    }), 200

def send_certificate_email(to_email, pdf_path):
    EMAIL = "rumanamubarak25@gmail.com"
    PASSWORD = "zbglafpjqgdwbooi"

    msg = EmailMessage()
    msg['Subject'] = "Your Certificate"
    msg['From'] = EMAIL
    msg['To'] = to_email
    msg.set_content("Congratulations! Please find your certificate attached.")

    with open(pdf_path, 'rb') as f:
        msg.add_attachment(
            f.read(),
            maintype='application',
            subtype='pdf',
            filename=os.path.basename(pdf_path)
        )

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(EMAIL, PASSWORD)
        smtp.send_message(msg)

@app.route('/verify/<cert_id>', methods=['GET'])
def verify_certificate(cert_id):
    try:
        response = cert_table.get_item(Key={'cert_id': cert_id})
        cert = response.get('Item')
        if cert:
            return jsonify({'valid': True, **cert}), 200
        else:
            return jsonify({'valid': False, 'message': 'Certificate not found'}), 404
    except Exception as e:
        return jsonify({'valid': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
