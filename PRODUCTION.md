# Running on port 80 (production)
To run @channel on port 80, you will need to proxy HTTP traffic through apache2 to Flask. This way, apache2 can handle the `static` files (which it's very good at - much better than the debug server built into Flask) and act as a reverse proxy for your dynamic content, passing those requests to Flask.

The following information was taken from https://www.digitalocean.com/community/tutorials/how-to-deploy-a-flask-application-on-an-ubuntu-vps.

1. You will need to make sure `mod_wsgi` is installed and enabled. Mod_wsgi is an Apache HTTP server mod that enables Apache to serve Flask applications. On linux, this will install and enable `mod_wsgi`.
```sh
$ sudo apt-get install libapache2-mod-wsgi # install
$ sudo a2enmod wsgi # enable
```
2. Create a directory called `atchannel` anywhere you want. Just remember the path to this directory. It will be reused later. Inside `atchannel`, place the previous `atchannel` directory cloned in development int this directory. If you have not already cloned the repo you can do so inside here. So now your file structure should look like this:
```
|-- atchannel/
|   |-- atchannel/
|   |   |-- __init__.py
|   |   |-- lib/
|   |   |-- private/
|   |   |-- static/
|   |   |-- templates/
|   |   |-- vendor.py
|   |   |-- .gitignore
|   |   |-- README.md
|   |   |-- requirements.txt
```

3. In the nested `atchannel` directory, create a file called `atchannel.wsgi` and include the following in it:
```py
#!/usr/bin/python
import sys
import logging
logging.basicConfig(stream=sys.stderr)
sys.path.insert(0,"/path/to/atchannel/")
# Here `atchannel` is the parent one, not the nested one
from atchannel import app as application
```
So your structure should look like this now:
```
|-- atchannel/
|   |-- atchannel/
|   |   |-- __init__.py
|   |   |-- lib/
|   |   |-- private/
|   |   |-- static/
|   |   |-- templates/
|   |   |-- vendor.py
|   |   |-- .gitignore
|   |   |-- README.md
|   |   |-- requirements.txt
|   |-- atchannel.wsgi
```

4. Create a file in `/etc/apache2/sites-available` called `atchannel`. If running on Ubuntu (13.10+), the file will end in a `.conf` and be `atchannel.conf`.
```sh
$ sudo vim /etc/apache2/sites-available/atchannel
or
$ sudo vim /etc/apache2/sites-available/atchannel.conf
```
Inside this file, place
```xml
<VirtualHost *:80>
		ServerName atchannel.whatevertopleveldomain
		WSGIScriptAlias / /path/to/atchannel/atchannel.wsgi
		<Directory /path/to/atchannel/atchannel/>
			Order allow,deny
			Allow from all
		</Directory>
		Alias /static /path/to/atchannel/atchannel/static
		<Directory /path/to/atchannel/atchannel/static/>
			Order allow,deny
			Allow from all
		</Directory>
		ErrorLog ${APACHE_LOG_DIR}/error.log
		LogLevel warn
		CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```
5. Enable the virtualhost and restart apache with the following commands:
```sh
$ sudo a2ensite atchannel
$ sudo service apache2 restart 
```
You may see the following
```
Could not reliably determine the VPS's fully qualified domain name, using 127.0.0.1 for ServerName 
```
This message is just a warning, and you will be able to access your virtual host without any further issues. 