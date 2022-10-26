# 🌿 SOSTEK Readme

## Setup Steps
1. [Download](https://www.mongodb.com/try/download/community) and install MongoDB
2. Verify if the service is already running or start it manually
- If you're on Linux, use `sudo systemctl enable --now mongodb` (if the system is running with systemd)
- If the system is not running with systemd, try `sudo service mongodb start` 
- If you're on another OS, Google knows :)
3. [Download](https://nodejs.org/en/download/) and install NodeJS
4. Clone the <i><b>simplerVersion_v2</b></i> branch of this repo
5. Open a terminal in the folder from the repo once download finishes
6. Install the dependencies running `npm install`
7. Transpile (Convert from TypeScript to JavaScript) the code by running `tsc`
8. Start the server with `npm start`
9. That's it! you can make POST request for Sign Up and Log In to the database ;)
- NOTE. Right now, will work only localhost (both the server and the database), just replace the IP to enable usage with server's IP
