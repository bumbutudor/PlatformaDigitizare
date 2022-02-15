import stanza


file = open('input.txt','r')
nlp = stanza.Pipeline('ro')


print("\n\n\n")
for line in file:
	propozitia=line
	resultat=nlp(propozitia)

	lst=[]


	
	for j in range(0,len(resultat.sentences)):
		for i in range(0, len(resultat.sentences[j].tokens)):
			lista1=[]
			lista1.append(resultat.sentences[j].words[i].text)
			lista1.append(resultat.sentences[j].words[i].upos)
			lst.append(lista1)



	for i in range(0,len(lst)-1):

		# problema-a doua 
		if lst[i+1][1]=="DET" and lst[i+1][0][0]=="-":

			cuvantul = lst[i+1][0]
			lst[i+1][0]=lst[i+1][0].replace("-"," ")

			line = line.replace(cuvantul, lst[i+1][0])

		#s- a
		#ne- am
		elif lst[i][1]=="PRON" and lst[i+1][1]=="AUX" and ("-" in lst[i][0] or "-" in lst[i+1][0]):
			lst[i][0]+=lst[i+1][0]
			lst[i+1][1]="*"
			lst[i][1]="%"

		#opriti -va
		elif lst[i][1]=="VERB" and lst[i+1][1]=="PRON" and lst[i+1][0][0]=="-":
			lst[i][0]+=lst[i+1][0]
			lst[i+1][1]="*"
			lst[i][1]="%"

		#ți- i
		elif lst[i][1]=="PRON" and lst[i+1][1]=="PRON" and ("-" in lst[i][0]):
			lst[i][0]+=lst[i+1][0]
			lst[i+1][1]="*"
			lst[i][1]="%"

		#să -si
		elif lst[i][1]=="PART" and lst[i+1][1]=="PRON" and ("-" in lst[i][0] or lst[i+1][0][0]=="-"):
			lst[i][0]+=lst[i+1][0]
			lst[i+1][1]="*"
			lst[i][1]="%"

		#regi -na
		elif lst[i][1]=="NOUN" and lst[i+1][1]=="NOUN" and lst[i+1][0][0]=="-":
			lst[i][0]+=lst[i+1][0]
			lst[i+1][1]="*"
		

		
		elif lst[i][1]=="PRON" and lst[i+1][1]=="NOUN" and lst[i+1][0][0]=="-":
			lst[i][0]+=lst[i+1][0]
			lst[i+1][1]="*"
			lst[i][1]=""



		#adau -ga
		elif lst[i][1]=="VERB" and lst[i+1][1]=="VERB" and lst[i+1][0][0]=="-":
			lst[i][0]+=lst[i+1][0]
			lst[i+1][1]="*"


	
	for item in lst:

		if item[1]!="*":

			if "-" in item[0] and item[1]!="%" and item[1]!="PROPN":
				cuvantul = item[0]
				item[0]=item[0].replace("-","")

				line = line.replace(cuvantul,item[0])


	line=line.replace("^ ","")
	line=line.replace("*","")
	



	print(line,end="")	 

	



        	

        		


    


