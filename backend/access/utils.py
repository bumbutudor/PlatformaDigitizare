import tempfile

import cv2
from cv2 import threshold
import numpy as np
from PIL import Image
import spacy
import nltk
import re


IMAGE_SIZE = 1800
BINARY_THREHOLD = 180

def process_image_for_ocr(file_path, out_path, resolution = 300):
    # TODO : Implement using opencv
    dpi = (resolution, resolution)
    temp_filename = set_image_dpi(file_path, dpi=dpi)
    im_new = remove_noise_and_smooth(temp_filename)
    cv2.imwrite(out_path, im_new)
    return im_new

def set_image_dpi(file_path, dpi = 300):
    im = Image.open(file_path)
    length_x, width_y = im.size
    factor = max(1, int(IMAGE_SIZE / length_x))
    size = factor * length_x, factor * width_y
    # size = (1800, 1800)
    im_resized = im.resize(size, Image.ANTIALIAS)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
    temp_filename = temp_file.name
    im_resized.save(temp_filename, dpi=dpi)
    return temp_filename

def image_smoothening(img):
    ret1, th1 = cv2.threshold(img, BINARY_THREHOLD, 255, cv2.THRESH_BINARY)
    ret2, th2 = cv2.threshold(th1, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    blur = cv2.GaussianBlur(th2, (1, 1), 0)
    ret3, th3 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return th3

def remove_noise_and_smooth(file_name):
    img = cv2.imread(file_name, 0)
    filtered = cv2.adaptiveThreshold(img.astype(np.uint8), 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 41,
                                     3)
    kernel = np.ones((1, 1), np.uint8)
    opening = cv2.morphologyEx(filtered, cv2.MORPH_OPEN, kernel)
    closing = cv2.morphologyEx(opening, cv2.MORPH_CLOSE, kernel)
    img = image_smoothening(img)
    or_image = cv2.bitwise_or(img, closing)
    return or_image

def preprocess_scantailor_cli(input_file, options, output):
    dpi = str(options['resolution'])
    threshold = str(options['threshold'])
    color_mode = options['colorMode']
    command = "scantailor-cli --dpi=" + dpi + " --color-mode=" + color_mode + " --threshold=" + threshold + " " + input_file + " " + output
    return command

def load_txt(filename):
    # open the file readonly
    file = open(filename, mode='rt', encoding='utf-8')
    # read the text
    text = file.read()
    # close the file
    file.close()
    return text


def remove_hyphen(trans_text):
    nlp = spacy.load("ro_core_news_lg")
    lista1=[]
    lista2=[]
    doc = nlp(trans_text)

    for token in doc:
        lista1.append(token.text)
        lista1.append(token.pos_)
        lista2.append(lista1)
        lista1=[]



    for word in lista2:
        if word[0][-1]!="-":
            if "-" in word[0]:
                cuvant=word[0].replace("-","")
                trans_text=trans_text.replace(word[0],cuvant)
    return trans_text




periodOptions = {
    'secolulXX': '0',
    'secolulXIX': '1',
    'secolulXVIII': '2',
    'secolulXVII': '3',
}
