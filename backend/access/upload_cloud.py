import abc
import boto3

class CloudUploader(abc.ABC):
    @abc.abstractmethod
    def upload_file(self, file: str, file_name: str) -> str:
        pass

class S3Uploader(CloudUploader):
    def __init__(self, bucket_name: str, s3_path: str, access_key: str, secret_key: str):
        self.bucket_name = bucket_name
        self.s3_path = s3_path
        self.s3 = boto3.client('s3', aws_access_key_id=access_key, aws_secret_access_key=secret_key)

    def upload_file(self, file: str, file_name: str) -> str:
        # Set the content type based on the file extension
        content_type = self.get_content_type(file_name)

        self.s3.upload_file(file, self.bucket_name, self.s3_path + file_name, ExtraArgs={'ContentType': content_type})
        return f'https://{self.bucket_name}.s3.amazonaws.com/{self.s3_path}{file_name}'
    
    def delete_file(self, file_name: str) -> None:
        self.s3.delete_object(Bucket=self.bucket_name, Key=self.s3_path + file_name)
    
    def get_file(self, file_name: str) -> str:
        return f'https://{self.bucket_name}.s3.amazonaws.com/{self.s3_path}{file_name}'
    
    # Set the content type based on the file extension
    def get_content_type(self, file_name: str) -> str:
        if file_name.endswith('.jpg') or file_name.endswith('.jpeg'):
            return 'image/jpeg'
        if file_name.endswith('.png'):
            return 'image/png'
        if file_name.endswith('.tif'):
            return 'image/tiff'
        if file_name.endswith('.gif'):
            return 'image/gif'
        if file_name.endswith('.svg'):
            return 'image/svg+xml'
        if file_name.endswith('.pdf'):
            return 'application/pdf'
        if file_name.endswith('.txt'):
            return 'text/plain'
        if file_name.endswith('.csv'):
            return 'text/csv'
        if file_name.endswith('.doc') or file_name.endswith('.docx'):
            return 'application/msword'
        if file_name.endswith('.xls') or file_name.endswith('.xlsx'):
            return 'application/vnd.ms-excel'
        if file_name.endswith('.ppt') or file_name.endswith('.pptx'):
            return 'application/vnd.ms-powerpoint'
        if file_name.endswith('.zip'):
            return 'application/zip'
        if file_name.endswith('.mp3'):
            return 'audio/mpeg'
        if file_name.endswith('.mp4'):
            return 'video/mp4'

        return 'application/octet-stream'