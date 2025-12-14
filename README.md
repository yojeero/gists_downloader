<img src="img/img.png" width="830"/>

#### Download all your gists via PowerShell with progress bar on Windows 11.

Each gist will be downloaded into its own separate folder with the gist name. 

- Put gist-downloader.js in folder where you want to save all your gists.   
- Install node.js - if it`s not already installed.   
- Open terminal and run:   

```powershell
npm init -y   
npm install axios commander cli-progress   
node .\gist-downloader.js --user YOUR_GISTS_NAME   
```   

Like this for me   

```powershell   
node .\gist-downloader.js -user yojeero   
```

#### If you want use it with token   

```powershell   
node .\gist-downloader.js -u YOUR_GISTS_NAME -t YOUR_GITHUB_TOKEN   
```