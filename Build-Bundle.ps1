Set-Location ".\src"
& "tsc"
& "browserify" -r ./avatarRenderer.js -r ./skinRenderer.js -o ../bundle.js
Set-Location ".."