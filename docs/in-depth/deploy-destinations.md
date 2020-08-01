# Deploy destinations

The `screeps.json` file is a JSON configuration file separated into multiple deploy destinations. We've given you three primary destinations by default.

```javascript
{
  // Used for deploying to the main world
  "main": {
    "email": "you@provider.tld",
    "password": "Password",
    "protocol": "https",
    "hostname": "screeps.com",
    "port": 443,
    "path": "/",
    "branch": "main"
  },
  // Used for deploying to Simulation mode
  "sim": {
    "email": "you@provider.tld",
    "password": "Password",
    "protocol": "https",
    "hostname": "screeps.com",
    "port": 443,
    "path": "/",
    "branch": "sim"
  },
  // Used for deploying to a private server
  "pserver": {
    "email": "username",
    "password": "Password",
    "protocol": "http",
    "hostname": "1.2.3.4",
    "port": 21025,
    "path": "/",
    "branch": "main"
  }
}
```

You can make as many separate destinations as you want. Just make a copy of any config object and perform the necessary changes. Once you're done, use the `--environment DEST:<dest>` argument on the `rollup` command to specify which environment to upload to.

```bash
rollup -c --environment DEST:main
```

Omitting the destination will perform a dry run, which will compile and bundle the code without uploading it.

