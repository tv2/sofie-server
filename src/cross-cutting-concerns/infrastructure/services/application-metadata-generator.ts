export class ApplicationMetadataGenerator {
  public generateMetadata(): object {
    return {
      ...this.getGitRevisionMetadata(),
      ...this.getServiceMetadata(),
    }
  }

  private getGitRevisionMetadata(): object | undefined {
    const gitRevision: string = process.env.GIT_REVISION ?? ''
    return gitRevision ? { gitRevision } : undefined
  }

  private getServiceMetadata(): object {
    const serviceName: string = process.env.SERVICE_NAME || 'alba-server'
    const serviceVersion: string = process.env.RELEASE_VERSION || ''
    return {
      service: {
        name: serviceName,
        version: serviceVersion
      }
    }
  }
}
