import * as core from '@actions/core'
import CloudWatch from 'aws-sdk/clients/cloudwatch'
import {postBuildStatus} from '../src/cw-build-status'

jest.mock('aws-sdk/clients/cloudwatch')
jest.mock('@actions/core')

const MOCK_NAMESPACE = 'GithubCI'
const MOCK_REPO = 'ros-tooling/action-cloudwatch-metrics'
const MOCK_RETURN = 'success'

describe('Integration test suite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(core, 'getInput')
        .mockReturnValueOnce(MOCK_NAMESPACE)  // namespace
        .mockReturnValueOnce(MOCK_REPO)       // project-name
        .mockReturnValueOnce(MOCK_RETURN)     // status
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
