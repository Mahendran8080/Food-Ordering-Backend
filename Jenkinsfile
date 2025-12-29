pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "food-ordering-backend"
        // Use a version tag based on build number for easy rollbacks
        DOCKER_TAG = "v${env.BUILD_NUMBER}"
    }

    stages {
        stage('Cleanup') {
            steps {
                echo 'Cleaning up workspace...'
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                // Replace with your actual repo URL
                git branch: 'main', url: 'https://github.com/Mahendran8080/Food-Ordering-Backend'
            }
        }

        stage('Install & Test') {
            steps {
                echo 'Installing Dependencies...'
                sh 'npm install'
                
                echo 'Running Quality Checks (Lint)...'
                // This will fail the build if there are syntax/style errors
                sh 'npm run lint' 

                echo 'Running Unit & Integration Tests...'
                // This ensures the logic and DB connections work
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker Image...'
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo 'Deploying Application...'
                // Using docker-compose handles starting Redis, Mongo, and the App together
                sh "docker-compose down || true"
                sh "docker-compose up -d"
            }
        }
    }

    post {
        success {
            echo "Successfully deployed Build #${env.BUILD_NUMBER}!"
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} failed. Please check the logs."
        }
    }
}