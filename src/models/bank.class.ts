export interface BankData {
  bankId: string
  friendlyName: string
  serviceStatus: boolean
}

export interface BankListData {
  banks: BankData[]
  profile: string
  refreshedAtSeconds: number
}

type BankStatus = 'Offline' | 'Online'

export class Bank {
  bankID: string
  friendlyName: string
  status: BankStatus

  get isOffline(): boolean {
    return this.status === 'Offline'
  }

  constructor(bankID: string, friendlyName: string, serviceStatus: boolean) {
    this.bankID = bankID
    this.friendlyName = friendlyName
    this.status = serviceStatus ? 'Online' : 'Offline'
  }

  static fromData(data: BankData) {
    return new Bank(data.bankId, data.friendlyName, data.serviceStatus)
  }
}
