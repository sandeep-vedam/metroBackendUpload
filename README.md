# Metro Backend - App Upload

The Metro Backend Upload is the _Command Line Interface_ tool to upload the Lightning application to the Metrological Back office.

To upload any Lightning App to the Metrological backend, we need to follow below steps:

1. Make sure releases folder is in the App root folder and it should have the tgz file that need to be uploaded.
2. Makse sure metadata.json file exists.
3. Execute the below command
```bash
npx metrobackendupload
```