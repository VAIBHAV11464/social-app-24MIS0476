// Jenkins pipeline for Social App (v1, v2, v3) - Agile Project 2 - 24MIS0476
// Flow: GitHub checkout -> Docker build -> Push to DockerHub -> Deploy to Kubernetes
// Written for Jenkins running on Windows (uses 'bat'). Works on Linux too (uses 'sh').
//
// Before first run, in Jenkins create a credential:
//   Manage Jenkins > Credentials > (global) > Add Credentials
//   Kind: Username with password, ID: dockerhub-creds
//   Username: your DockerHub username, Password: your DockerHub password/access token

pipeline {
    agent any

    parameters {
        choice(name: 'APP_VERSION', choices: ['all', 'v1', 'v2', 'v3'], description: 'Which version to build and deploy')
        string(name: 'DOCKERHUB_USER', defaultValue: 'your-dockerhub-username', description: 'Your DockerHub username')
    }

    environment {
        IMAGE_NAME = "${params.DOCKERHUB_USER}/social-app"
    }

    stages {
        stage('Checkout from GitHub') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    for (v in versions()) {
                        echo "Building ${env.IMAGE_NAME}:${v}"
                        run("docker build -t ${env.IMAGE_NAME}:${v} ${v}")
                    }
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                                  usernameVariable: 'DH_USER',
                                                  passwordVariable: 'DH_PASS')]) {
                    script {
                        if (isUnix()) {
                            sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
                        } else {
                            bat 'echo %DH_PASS%| docker login -u %DH_USER% --password-stdin'
                        }
                        for (v in versions()) {
                            run("docker push ${env.IMAGE_NAME}:${v}")
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    for (v in versions()) {
                        def file = "k8s/social-app-${v}.yaml"
                        if (isUnix()) {
                            sh "sed 's#DOCKERHUB_USERNAME#${params.DOCKERHUB_USER}#g' ${file} | kubectl apply -f -"
                        } else {
                            bat "powershell -NoProfile -Command \"(Get-Content '${file}') -replace 'DOCKERHUB_USERNAME','${params.DOCKERHUB_USER}' | kubectl apply -f -\""
                        }
                        run("kubectl rollout restart deployment/social-app-${v}")
                    }
                    run("kubectl get deployments,services")
                }
            }
        }
    }

    post {
        success {
            echo 'Deployed! Open: v1 -> http://localhost:30001  v2 -> http://localhost:30002  v3 -> http://localhost:30003'
        }
        always {
            script { try { run('docker logout') } catch (e) { } }
        }
    }
}

def versions() {
    return params.APP_VERSION == 'all' ? ['v1', 'v2', 'v3'] : [params.APP_VERSION]
}

def run(String cmd) {
    if (isUnix()) { sh cmd } else { bat cmd }
}
