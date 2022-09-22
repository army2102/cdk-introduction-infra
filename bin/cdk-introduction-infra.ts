#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkIntroductionInfraStack } from '../lib/cdk-introduction-infra-stack';

const app = new cdk.App();
new CdkIntroductionInfraStack(app, 'CdkIntroductionInfraStack');
