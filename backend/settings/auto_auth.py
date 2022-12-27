from django.contrib.auth.models import User
from django.utils.deprecation import MiddlewareMixin

class AutoAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.user = User.objects.filter()[0]