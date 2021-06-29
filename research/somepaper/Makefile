PROJ_NAME = somepaper

SRC_DIR = .
DOCS_DIR = out

CC = pdflatex
CFLAGS = 

BIBC = bibtex
BIBCFLAGS = 

$(DOCS_DIR)/$(PROJ_NAME).pdf: $(SRC_DIR)/*.tex
	$(CC) $(CFLAGS) $(SRC_DIR)/$(PROJ_NAME).tex
#	$(BIBC) $(BIBCFLAGS) $(PROJ_NAME)
	$(CC) $(CFLAGS) $(SRC_DIR)/$(PROJ_NAME).tex
	mv $(PROJ_NAME).pdf $(DOCS_DIR)/$(PROJ_NAME).pdf

.PHONY: clean
clean:
	rm $(DOCS_DIR)/$(PROJ_NAME).pdf
	rm $(PROJ_NAME).log
	rm $(PROJ_NAME).aux
	rm $(PROJ_NAME).out
	rm $(PROJ_NAME).run.xml
	rm $(PROJ_NAME).bcf
