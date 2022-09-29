#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { CdkIntroductionInfraCoreStack } from '../lib/cdk-introduction-infra-core-stack'

const app = new cdk.App()
new CdkIntroductionInfraCoreStack(app, 'Nae3xCdkIntroductionInfraStack')
