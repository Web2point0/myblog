---
layout: post
title:  "Hosting your own personal blog using a Raspberry pi 4"
date:   2025-07-25 04:26:08 +0100
categories: technology
---

<a href="https://www.howtogeek.com/"><img src="https://static1.howtogeekimages.com/wordpress/wp-content/uploads/2022/02/raspberry_pi_4_and_logo_hero.jpg?q=50&fit=crop&w=1140&h=&dpr=1.5" /></a>

*If you already have a desktop GUI go ahead and skip this part.

<code>sudo tasksel</code>

The static website blog generator we’ll be using is called Jekyll go ahead and install that onto your machine. Be sure to have all your prerequisites:

<code>sudo apt-get install ruby-full build-essential</code>

Now, let us proceed to download jekyll: 
<code>gem install bundler jekyll</code> 
Having that installed we can create the static blog:
<code>jekyll new myblog</code> *Feel free to remove “myblog” and call your site whatever.
With your newly created blog go ahead and change directories by typing the code below:
<code>cd /home/YOUR-RASPBERRYPI-USERNAME/myblog/</code>
go ahead and run this script: <code>bundle exec jekyll serve</code> 
You now should now be able to visit http://localhost:4000

*You must visit the directory of your blog files to run <code>jekyll serve</code> and only need to run bundle exec jekyll serve when first init the build of your jekyll blog.

<h3>Creating the Virtual Host on the raspberry pi</h3>

Now, lets get the server NGINX up and going. Go ahead and install <code>sudo apt install nginx</code>


The code below will make the link between your localhost and the Nginx server to be visible on port 80 or (http and https). Go create in your terminal <code>sudo nano /etc/nginx/sites-available/jekyll.conf</code> *Feel free to name the file whatever you like. In the file called raspberrypistatic.conf write out the code below and save file: CTRL + X + CTRL + Y + ENTER

<textarea>
server {

listen 80;

server_name example.com;

location / {

proxy_pass http://localhost:4000;

proxy_set_header Host $host;

proxy_set_header X-Real-IP $remote_addr;

proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

}

} 
</textarea>


With the file now written, we’ll be creating a symbolic link between where the file was written to the “sites-enabled” directory. 
<code>
<code>sudo ln -s /etc/nginx/sites-available/jekyll.conf /etc/nginx/sites-enabled/</code> *This links it to "/etc/nginx/sites-enabled".

<h3>Starting the NGINX web server</h3>

run <code>sudo nginx -t</code> If everything is a-okay let us restart the Nginx web server and run <code>sudo systemctl reload nginx</code>

Both nginx and jekyll remind me of a program I used to use back in the day called XAMPP. Ohh, the memories of creating local websites and server applications.

<h3>Installing the Cloudflared tunnel service</h3>

<textarea>
# Add cloudflare gpg key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

# Add this repo to your apt repositories
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# install cloudflared
sudo apt-get update && sudo apt-get install cloudflared
</textarea>

Now, login to use the service: <code>cloudflared tunnel login</code> You’ll receive a message in your terminal with a cloudflare link; if it doesn’t open automatically go ahead and copy and paste the link into your browser to authenticate your tunnel. To do so you’re going to need to provide your login credentials for cloudflare.

Once you’ve logged onto cloudflare.com and authenticated with the cloudflare services you’ll receive a message in your terminal if you successfully logged in. Let’s create the tunnel: cloudflared tunnel create TUNNELNAME After running the above command, please copy & save the message of the ID given for the tunnel credentials for later use. 

Now, we’re going to be creating a CNAME for the domain and linking it to the cloudflare tunnel. 
<code>cloudflared tunnel route dns TUNNELNAME DOMAINNAME.COM </code>
If all goes well, you should receive a message in the terminal INF ADDED CNAME. 

Forward the ports through the cloudflare tunnel: <code>cloudflared tunnel run --url localhost:80 TUNNELNAME</code> 

You should get in terminal INF STARTING TUNNEL TUNNEL ID=XXXXXXX….. If all is working you should be able to visit your domain on the internet.

Sources:
<a href="https://pimylifeup.com/raspberry-pi-public-static-website/">pimylifeup.com/raspberry-pi-public-static-website</a><br>
<a href="https://pimylifeup.com/raspberry-pi-cloudflare-tunnel/">pimylifeup.com/raspberry-pi-cloudflare-tunnel/</a><br>
<a href="https://www.selfhostedninja.com/jekyll-the-ultimate-guide-to-self-hosting/">selfhostedninja.com/jekyll-the-ultimate-guide-to-self-hosting/</a><br>
<a href="https://pkg.cloudflare.com/index.html#debian-any">pkg.cloudflare.com/index.html#debian-any</a><br>
<a href="https://nginx.org/en/linux_packages.html">nginx.org/en/linux_packages.html</a><br>
<a href="https://jekyllrb.com/docs/installation/other-linux/">jekyllrb.com/docs/installation/other-linux/</a>
