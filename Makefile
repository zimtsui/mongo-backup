executable = mongo-backup

install:
	cp -Lp ./$(executable) /usr/local/bin
uninstall:
	rm /usr/local/bin/$(executable)
