# node-refserver

node-refserver provides a relatively complete and simple base for developing new servers.

## Synopsis

Install an SSL certificate (ie. letsencrypt), then:

```
$ git clone https://github.com/psema4/node-refserver.git your-project-name
$ cd your-project-name
$ rm -rf ".git"
$ vim config.js # edit your site configuration
$ node bin/server.js # test your site configuration
```

After configuring and testing your server, create your new git repo and make your initial commit.

To add, remove or edit...

* layout: /views/\*
* static files: /public/\*
* routing, api and websocket endpoints: /bin/server.js
* api handlers: /lib/api.js

## Note

If the ssl section is missing or commented out websocket support will not be enabled.

## License

MIT
