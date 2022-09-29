import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'

export class CdkIntroductionInfraCoreStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Create Codebuild
    // 1. เชื่อม GitHub
    const githubSource = codebuild.Source.gitHub({
      owner: 'army2102',
      repo: 'cdk-introduction-app',
      webhook: true,
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(
          'main'
        )
      ]
    })

    // 2. สร้าง Code Build
    const project = new codebuild.Project(this, 'Nae3x-CodebuildProject', {
      projectName: 'nae3x-user-management-api',
      source: githubSource,
      // TODO: What if buildspec is in the other place?
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        privileged: true
      }
    })

    // 3. set iam credential เพิ่อ Push Image ขึ้น ECR
    const rawPolicyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'CloudFormationTemplate',
          Effect: 'Allow',
          Action: ['cloudformation:CreateChangeSet'],
          Resource: [
            'arn:aws:cloudformation:*:aws:transform/Serverless-2016-10-31'
          ]
        },
        {
          Sid: 'CloudFormationStack',
          Effect: 'Allow',
          Action: [
            'cloudformation:CreateChangeSet',
            'cloudformation:CreateStack',
            'cloudformation:DeleteStack',
            'cloudformation:DescribeChangeSet',
            'cloudformation:DescribeStackEvents',
            'cloudformation:DescribeStacks',
            'cloudformation:ExecuteChangeSet',
            'cloudformation:GetTemplateSummary',
            'cloudformation:ListStackResources',
            'cloudformation:UpdateStack'
          ],
          Resource: ['arn:aws:cloudformation:*:784074879813:stack/*']
        },
        {
          Sid: 'S3',
          Effect: 'Allow',
          Action: ['s3:CreateBucket', 's3:GetObject', 's3:PutObject'],
          Resource: ['arn:aws:s3:::*/*']
        },
        {
          Sid: 'ECRRepository',
          Effect: 'Allow',
          Action: [
            'ecr:BatchCheckLayerAvailability',
            'ecr:BatchGetImage',
            'ecr:CompleteLayerUpload',
            'ecr:CreateRepository',
            'ecr:DeleteRepository',
            'ecr:DescribeImages',
            'ecr:DescribeRepositories',
            'ecr:GetDownloadUrlForLayer',
            'ecr:GetRepositoryPolicy',
            'ecr:InitiateLayerUpload',
            'ecr:ListImages',
            'ecr:PutImage',
            'ecr:SetRepositoryPolicy',
            'ecr:UploadLayerPart'
          ],
          Resource: ['arn:aws:ecr:*:784074879813:repository/*']
        },
        {
          Sid: 'ECRAuthToken',
          Effect: 'Allow',
          Action: ['ecr:GetAuthorizationToken'],
          Resource: ['*']
        },
        {
          Sid: 'Lambda',
          Effect: 'Allow',
          Action: [
            'lambda:AddPermission',
            'lambda:CreateFunction',
            'lambda:DeleteFunction',
            'lambda:GetFunction',
            'lambda:GetFunctionConfiguration',
            'lambda:CreateFunctionUrlConfig',
            'lambda:ListTags',
            'lambda:RemovePermission',
            'lambda:TagResource',
            'lambda:UntagResource',
            'lambda:UpdateFunctionCode',
            'lambda:UpdateFunctionConfiguration'
          ],
          Resource: ['arn:aws:lambda:*:784074879813:function:*']
        },
        {
          Sid: 'IAM',
          Effect: 'Allow',
          Action: [
            'iam:CreateRole',
            'iam:AttachRolePolicy',
            'iam:DeleteRole',
            'iam:DetachRolePolicy',
            'iam:GetRole',
            'iam:TagRole'
          ],
          Resource: ['arn:aws:iam::784074879813:role/*']
        },
        {
          Sid: 'IAMPassRole',
          Effect: 'Allow',
          Action: 'iam:PassRole',
          Resource: '*',
          Condition: {
            StringEquals: {
              'iam:PassedToService': 'lambda.amazonaws.com'
            }
          }
        },
        {
          Sid: 'APIGateway',
          Effect: 'Allow',
          Action: [
            'apigateway:DELETE',
            'apigateway:GET',
            'apigateway:PATCH',
            'apigateway:POST',
            'apigateway:PUT'
          ],
          Resource: ['arn:aws:apigateway:*::*']
        }
      ]
    }
    const policyDoccument = iam.PolicyDocument.fromJson(rawPolicyDocument)
    const policy = new iam.Policy(this, 'Nae3xCodepipelinePolicy', {
      document: policyDoccument
    })
    project.role?.attachInlinePolicy(policy)

    // Create repository in ECR
    const repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'nae-user-managmement-api',
      imageScanOnPush: true
    })

    // defines an AWS Lambda resource
    // const userManagementApp = new lambda.Function(this, 'UserManagementApp', {
    //   runtime: lambda.Runtime.NODEJS_16_X, // execution environment
    //   code: lambda.Code.fromdoc('lambda'), // code loaded from "lambda" directory
    //   handler: 'index.lambdaHandler' // file is "hello", function is "handler"
    // })

    // // defines an API Gateway REST API resource backed by our "hello" function.
    // new apigw.LambdaRestApi(this, 'Endpoint', {
    //   handler: userManagementApp
    // })
  }
}
