const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const spinner = require('ora')()
const inquirer = require('inquirer')
const path = require('path')
const chalk = require('chalk')

let metaDataPath
let metaDataInfo
let releaseFilePath
let releaseTarFileName

// type = null, choices = null
const ask = (question, defaultAnswer = null, type = null, choices = []) => {
    return inquirer
        .prompt([{ name: 'q', message: question, default: defaultAnswer, type, choices }])
        .then(answers => answers.q)
}
const exit = msg => {
    spinner.fail(msg)
    process.exit()
}

const sequence = steps => {
    return steps.reduce((promise, method) => {
        return promise
            .then(function() {
                return method(...arguments)
            })
            .catch(e => Promise.reject(e))
    }, Promise.resolve(null))
}

const UPLOAD_ERRORS = {
    version_already_exists: 'The current version of your app already exists',
    missing_field_file: 'There is a missing field',
    app_belongs_to_other_user: 'You are not the owner of this app',
}

const login = key => {
    spinner.start('Authenticating with Metrological Back Office')
    return axios
        .get('https://api.metrological.com/api/authentication/login-status', {
            headers: { 'X-Api-Token': key },
        })
        .then(({ data }) => {
            const user = data.securityContext.pop()
            if (user) {
                spinner.succeed()
                return user
            }
            exit('Unexpected authentication error')
        })
        .catch(err => {
            exit('Incorrect API key or not logged in to metrological dashboard')
        })
}

const checkFilesRequired = () => {
    metaDataPath = path.join(process.cwd(), 'metadata.json')
    console.log('metaData Path', metaDataPath)

    if (!fs.existsSync(metaDataPath)) {
        exit(chalk.red('Please make sure the command runs in the Application root folder or Metadata file does not exists in the App root folder'))
    } else {
        metaDataInfo = JSON.parse(fs.readFileSync(`${metaDataPath}`, 'utf-8'))
        console.log('metaData Info', metaDataInfo)
        releaseTarFileName = [metaDataInfo.identifier, metaDataInfo.version, 'tgz'].join('.').replace(/\s/g, '_')
        releaseFilePath = path.join(path.join(process.cwd(), 'releases'), releaseTarFileName)
        console.log('Release file Path', releaseFilePath)
    }

    if (!fs.existsSync(releaseFilePath)) {
        exit(chalk.red('Application tar file is not available. Please make sure tar file is available in the releases folder of the app'))
    }
}

const upload = (user) => {
    spinner.start('Uploading package to Metrological Back Office')
    if (!metaDataInfo.identifier) {
        exit("Metadata.json doesn't contain an identifier field")
    }
    if (!metaDataInfo.version) {
        exit("Metadata.json doesn't contain an version field")
    }

    const form = new FormData()
    form.append('id', metaDataInfo.identifier)
    form.append('version', metaDataInfo.version)
    form.append('upload', fs.createReadStream(releaseFilePath))

    const headers = form.getHeaders()
    headers['X-Api-Token'] = user.apiKey

    axios
        .post('https://api.metrological.com/api/' + user.type + '/app-store/upload-lightning', form, {
            headers,
        })
        .then(({ data }) => {
            // errors also return a 200 status reponse, so we intercept errors here manually
            if (data.error) {
                exit(UPLOAD_ERRORS[data.error] || data.error)
            } else {
                spinner.succeed()
            }
        })
        .catch(err => {
            exit(UPLOAD_ERRORS[err] || err)
        })
}

const checkUploadFileSize = () => {
    const stats = fs.statSync(releaseFilePath)
    const fileSizeInMB = stats.size / 1000000 //convert from Bytes to MB

    if (fileSizeInMB >= 10) {
        exit('Upload File size is greater than 10 MB. Please make sure the size is less than 10MB')
    }
}

module.exports = () => {
    let user
    return sequence([
        () => checkFilesRequired(),
        // todo: save API key locally for future use and set it as default answer
        () => ask('Please provide your API key'),
        apiKey => login(apiKey).then(usr => ((user = usr), (usr.apiKey = apiKey))),
        () => checkUploadFileSize(),
        () => upload(user),
    ])
}
