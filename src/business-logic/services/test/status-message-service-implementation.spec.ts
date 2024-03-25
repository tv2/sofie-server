import { StatusMessageServiceImplementation } from '../status-message-service-implementation'
import { StatusMessageService } from '../interfaces/status-message-service'
import { anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { StatusMessageEventEmitter } from '../interfaces/status-message-event-emitter'
import { StatusMessageRepository } from '../../../data-access/repositories/interfaces/status-message-repository'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { StatusCode } from '../../../model/enums/status-code'
import { StatusMessage } from '../../../model/entities/status-message'

describe(StatusMessageServiceImplementation.name, () => {
  describe(StatusMessageServiceImplementation.prototype.updateStatusMessage.name, () => {
    describe('the StatusMessage does not already exist in the database', () => {
      it('does nothing when the StatusMessage is GOOD', async () => {
        const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
        const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()
        const statusMessage: StatusMessage = EntityTestFactory.createStatusMessage({ statusCode: StatusCode.GOOD })

        const testee: StatusMessageService = createTestee({ statusMessageEventEmitter, statusMessageRepository })
        await testee.updateStatusMessage(statusMessage)

        verify(statusMessageEventEmitter.emitStatusMessageEvent(anything())).never()
        assertNoModifyMethodsCalled(statusMessageRepository)
      })

      describe('the StatusMessage is BAD', () => {
        it('emits a StatusMessageEvent with the StatusMessage', async () => {
          const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
          const statusMessage: StatusMessage = EntityTestFactory.createStatusMessage({ statusCode: StatusCode.BAD })

          const testee: StatusMessageService = createTestee({ statusMessageEventEmitter })
          await testee.updateStatusMessage(statusMessage)

          verify(statusMessageEventEmitter.emitStatusMessageEvent(statusMessage)).once()
        })

        it('saves the StatusMessage to the database', async () => {
          const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()
          const statusMessage: StatusMessage = EntityTestFactory.createStatusMessage({ statusCode: StatusCode.BAD })

          const testee: StatusMessageService = createTestee({ statusMessageRepository })
          await testee.updateStatusMessage(statusMessage)

          verify(statusMessageRepository.createStatusMessage(statusMessage)).once()
        })
      })
    })

    describe('the statusMessage exist in the database', () => {
      it ('does nothing when the StatusMessage has the same StatusCode and Message as the one in the database', async () => {
        const statusMessage: StatusMessage = EntityTestFactory.createStatusMessage({ statusCode: StatusCode.BAD, message: 'Some message' })

        const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
        const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()
        when(statusMessageRepository.getStatusMessage(statusMessage.id)).thenReturn(Promise.resolve(statusMessage))

        const testee: StatusMessageService = createTestee({ statusMessageEventEmitter, statusMessageRepository })
        await testee.updateStatusMessage(statusMessage)

        verify(statusMessageEventEmitter.emitStatusMessageEvent(anything())).never()
        assertNoModifyMethodsCalled(statusMessageRepository)
      })

      describe('the StatusMessage is different from the one in the database', () => {
        it('emits a StatusMessageEvent for the new StatusMessage', async () => {
          const statusMessageFromDatabase: StatusMessage = EntityTestFactory.createStatusMessage({ message: 'Some message' })
          const newStatusMessage: StatusMessage = EntityTestFactory.createStatusMessage({ message: 'Some other message' })

          const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
          const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()
          when(statusMessageRepository.getStatusMessage(statusMessageFromDatabase.id)).thenReturn(Promise.resolve(statusMessageFromDatabase))

          const testee: StatusMessageService = createTestee({ statusMessageEventEmitter, statusMessageRepository })
          await testee.updateStatusMessage(newStatusMessage)

          verify(statusMessageEventEmitter.emitStatusMessageEvent(newStatusMessage)).once()
        })

        it('deletes the StatusMessage from the database when the Status is GOOD', async () => {
          const statusMessageFromDatabase: StatusMessage = EntityTestFactory.createStatusMessage({ message: 'Some message' })
          const newStatusMessage: StatusMessage = EntityTestFactory.createStatusMessage({ statusCode: StatusCode.GOOD, message: 'Some other message' })

          const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()
          when(statusMessageRepository.getStatusMessage(statusMessageFromDatabase.id)).thenReturn(Promise.resolve(statusMessageFromDatabase))

          const testee: StatusMessageService = createTestee({ statusMessageRepository })
          await testee.updateStatusMessage(newStatusMessage)

          verify(statusMessageRepository.deleteStatusMessage(newStatusMessage.id)).once()
          verify(statusMessageRepository.createStatusMessage(anything())).never()
          verify(statusMessageRepository.updateStatusMessage(anything())).never()
        })

        it('updates the StatusMessage in the database when the Status is not GOOD',
          async () => {
            const statusMessageFromDatabase: StatusMessage = EntityTestFactory.createStatusMessage({message: 'Some message'})
            const newStatusMessage: StatusMessage = EntityTestFactory.createStatusMessage({ statusCode: StatusCode.BAD, message: 'Some other message' })

            const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()
            when(statusMessageRepository.getStatusMessage(statusMessageFromDatabase.id)).thenReturn(Promise.resolve(statusMessageFromDatabase))

            const testee: StatusMessageService = createTestee({statusMessageRepository})
            await testee.updateStatusMessage(newStatusMessage)

            verify(statusMessageRepository.updateStatusMessage(newStatusMessage)).once()
            verify(statusMessageRepository.createStatusMessage(anything())).never()
            verify(statusMessageRepository.deleteStatusMessage(anything())).never()
          })
      })
    })
  })
})

function createTestee(params?: {
  statusMessageEventEmitter?: StatusMessageEventEmitter,
  statusMessageRepository?: StatusMessageRepository
}): StatusMessageService {
  return new StatusMessageServiceImplementation(
    instance(params?.statusMessageEventEmitter ?? mock<StatusMessageEventEmitter>()),
    instance(params?.statusMessageRepository ?? mock<StatusMessageRepository>()),
  )
}

function assertNoModifyMethodsCalled(statusMessageRepository: StatusMessageRepository): void {
  verify(statusMessageRepository.createStatusMessage(anything())).never()
  verify(statusMessageRepository.updateStatusMessage(anything())).never()
  verify(statusMessageRepository.deleteStatusMessage(anything())).never()
}
