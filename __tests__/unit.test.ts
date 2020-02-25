import * as core from '@actions/core'
import {checkStatusString, createMetricDatum, publishMetricData} from '../src/cw-build-status'
import CloudWatch from 'aws-sdk/clients/cloudwatch'

jest.mock('aws-sdk/clients/cloudwatch')

const ENVIRONMENT_VARIABLE_OVERRIDES = {
  GITHUB_REPOSITORY: 'MY-REPOSITORY-NAME',
  GITHUB_WORKFLOW: 'MY-WORKFLOW-ID',
  GITHUB_ACTION: 'MY-ACTION-NAME',
  GITHUB_ACTOR: 'MY-USERNAME[bot]',
  GITHUB_REF: 'MY-BRANCH',
  GITHUB_SHA: 'MY-COMMIT-ID',
}

describe('unit test suite', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {...OLD_ENV, ...ENVIRONMENT_VARIABLE_OVERRIDES};
  })

  test('checkStatusString passes on valid success string', async () => {
      expect(() => {
        checkStatusString('success')
      }).not.toThrow()
  })

  test('checkStatusString throws on invalid status string', async () => {
    expect(() => {
      checkStatusString('foo')
    }).toThrow()
  })

  test('createMetricDatum returns valid datum', async () => {
    const metricName = 'MyMetric'
    const projectName = 'MyProject'
    const isCronJob = true
    const value = 1.0
    const result = createMetricDatum(metricName, projectName, isCronJob, value)
    expect(result.MetricName).toStrictEqual(metricName)
    expect(result.Value).toStrictEqual(value)
    expect(result.Dimensions.length).toBeGreaterThanOrEqual(1)
  })

  test('publishMetricData calls SDK', async () => {
    CloudWatch.prototype.putMetricData = jest.fn().mockImplementationOnce(() => {
      return {
        promise() {
          return Promise.resolve({
            data: 'success'
          })
        }
      }
    })
    jest.spyOn(core, 'getInput')
        .mockReturnValueOnce('GithubCI')  // namespace
        .mockReturnValueOnce('ros-tooling/action-cloudwatch-metrics')  // project-name
        .mockReturnValueOnce('success')  // status
        
    const metricNamespace = 'MyNamespace'
    const metricName = 'MyMetric'
    const projectName = 'MyProject'
    const isCronJob = true
    const value = 1.0
    const datum = createMetricDatum(metricName, projectName, isCronJob, value)
    const metricData = [datum]
    
    publishMetricData(metricNamespace, metricData)
    expect(CloudWatch.prototype.putMetricData).toBeCalled()
  })
})
