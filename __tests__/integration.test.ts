import * as core from '@actions/core'
import * as path from 'path'
import CloudWatch from 'aws-sdk/clients/cloudwatch'
import {postBuildStatus} from '../src/cw-build-status'

jest.mock('aws-sdk/clients/cloudwatch')
jest.mock('@actions/core')

const ENVIRONMENT_VARIABLE_OVERRIDES = {
  GITHUB_ACTION: 'MY-ACTION-NAME',
  GITHUB_ACTOR: 'MY-USERNAME[bot]',
  GITHUB_EVENT_PATH: path.join(__dirname, 'payload.json'),
  GITHUB_REF: 'MY-BRANCH',
  GITHUB_REPOSITORY: 'MY-REPOSITORY-NAME',
  GITHUB_SHA: 'MY-COMMIT-ID',
  GITHUB_WORKFLOW: 'MY-WORKFLOW-ID'
}
const MOCK_NAMESPACE = 'GithubCI'
const MOCK_REPO = 'ros-tooling/action-cloudwatch-metrics'
const MOCK_RETURN = 'success'

describe('Integration test suite', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(core, 'getInput')
        .mockReturnValueOnce(MOCK_NAMESPACE)  // namespace
        .mockReturnValueOnce(MOCK_REPO)       // project-name
        .mockReturnValueOnce(MOCK_RETURN)     // status
    process.env = {...OLD_ENV, ...ENVIRONMENT_VARIABLE_OVERRIDES};  
  })

  test('post build metrics successfully', async () => {
    CloudWatch.prototype.putMetricData = jest.fn().mockImplementationOnce(() => {
      return {
        promise() {
          return Promise.resolve({
            error: null,
            data: 'success'
          })
        }
      }
    })
    await postBuildStatus()
    expect(CloudWatch.prototype.putMetricData).toBeCalled()
  })

  test('fail when cloudwatch fails', async () => {
    CloudWatch.prototype.putMetricData = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve({
        error: Error('Could not post metrics'),
        data: null
      })
    })
    const mockSetFailed = jest.spyOn(core, 'setFailed')
    await postBuildStatus()
    expect(mockSetFailed).toHaveBeenCalled()
  })
})
