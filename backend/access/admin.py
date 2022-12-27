from django.contrib import admin
from django.contrib.auth.models import User
anonymous_user = User.objects.all().first()
admin.site.has_permission = lambda r: setattr(r, 'user', anonymous_user) or True
from .models import File
from .models import Period
from .models import Alphabet
from .models import ExceptionDictionary
from .models import ExceptionDictionaryEntry
from .models import OCRModel
from .models import PreprocessingEngine
from .models import PreprocessingEngineModule
from .models import PostprocessingEngine
from .models import PostprocessingEngineModule
from .models import DigiDocument
from .models import InstrumentsAndResources

admin.site.register(ExceptionDictionaryEntry)
admin.site.register(ExceptionDictionary)
admin.site.register(Alphabet)
admin.site.register(Period)
admin.site.register(File)
admin.site.register(OCRModel)
admin.site.register(PreprocessingEngine)
admin.site.register(PreprocessingEngineModule)
admin.site.register(PostprocessingEngine)
admin.site.register(PostprocessingEngineModule)
admin.site.register(DigiDocument)
admin.site.register(InstrumentsAndResources)

