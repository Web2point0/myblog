---
layout: post
title:  "Cloudflared tunnel service"
date:   2025-08-29 00:57:10 +0000
categories: technology
---

This is an update on self hosting with cloudflared service using a raspberry pi 4. I was learning and making things more complicated than they already are. I'm pretty sure you don't even need to run the NGINX engine either as once you install Jekyll and run it on localhost:4000 you'll be able to use the cloudflared service to open up localhost:4000 instead of having to do it through nginx. 

If y'all don't know what I'm talking about feel free to read my first blog post on this matter: (<a href="https://myyear.net/technology/2025/07/25/hosting-a-personal-blog.html">hosting a personal blog</a>) or don't and proceed with this simple method.
As I'm running on a raspberry pi I'll be downloading via Linux:

Add Cloudflare's package signing key:
<code> sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null</code>

Add Cloudflare's apt repo to your apt repositories:
<code> echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list</code>

Update repositories and install cloudflared:
<code>sudo apt-get update && sudo apt-get install cloudflared </code>

Now, login to cloudflare's website to authenticate; in terminal type:
<code>cloudflared tunnel login </code>
You should be automatically redirected to their website, if not just copy the link provided in the terminal and proceed to authenticate on there website.

in your <code>.cloudflared</code> directory, create a config.yml file using any text editor. This file will configure the tunnel to route traffic from a given origin to the [hostname] of your choice.

I just used the in-terminal editor (cd) change directory to .cloudflared <code> nano config.yml </code>

Since, we're connecting our tunnel to a application like jekyll which runs on localhost:4000 go ahead in that config file type:
<textarea> 
url: http://localhost:4000
tunnel: [Tunnel-UUID]
credentials-file: /root/.cloudflared/[Tunnel-UUID].json
</textarea>

Now, we will route the traffic to your website.
<code>cloudflared tunnel route dns [UUID or NAME] [hostname]</code>
If I remember correctly I added the UUID, which was the one given to me when I created my tunnel followed by myyear.net. If not, I might of just did:
<code> cloudflared tunnel route dns TUNNELNAME DOMAINNAME</code>

Finally, run the tunnel:
<code> cloudflared tunnel run [UUID or NAME]</code>


Sources:
<a href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/local-management/create-local-tunnel/">Cloudflared tunnel service</a>

<a href="https://pimylifeup.com/raspberry-pi-cloudflare-tunnel/">Cloudflared on raspberry pi</a>

<a href="https://jekyllrb.com/">Jekyll blog aggregator</a>
