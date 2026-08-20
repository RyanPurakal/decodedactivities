export type BillLineItem = {
  id: number
  description: string
  cpt: string | null
  amount: number
  isError: boolean
  errorExplanation: string | null
  legitimateExplanation: string | null
}

export type EobLineItem = {
  id: string
  description: string
  billed?: number
  allowed: number
  planPaid: number
  patientResponsibility: number
}

export type AssistanceOption = {
  id: number
  label: string
  recommendation: string
  explanation: string
}

export const billAuditData = {
  title: 'Bill Audit',
  billTotal: 4820,
  billLineItems: [
    {
      id: 1,
      description: 'ER Facility Fee Level 4',
      cpt: '99285',
      amount: 1850,
      isError: false,
      errorExplanation: null,
      legitimateExplanation: 'Standard ER charge matching the EOB.',
    },
    {
      id: 2,
      description: 'CT Scan Head w/o Contrast',
      cpt: '70450',
      amount: 1100,
      isError: false,
      errorExplanation: null,
      legitimateExplanation:
        'This is one of two duplicate CT rows. Flagging either CT row counts as spotting the duplicate issue.',
    },
    {
      id: 3,
      description: 'CT Scan Head w/o Contrast',
      cpt: '70450',
      amount: 1100,
      isError: true,
      errorExplanation:
        'Duplicate charge: this CT scan appears twice on the bill but the EOB only shows one. Either row being flagged counts as spotting the duplicate.',
      legitimateExplanation: null,
    },
    {
      id: 4,
      description: 'IV Hydration Therapy',
      cpt: '96365',
      amount: 140,
      isError: false,
      errorExplanation: null,
      legitimateExplanation: 'Ordered treatment, appears on the EOB.',
    },
    {
      id: 5,
      description: 'Anesthesiologist (Out-of-Network)',
      cpt: '00140',
      amount: 350,
      isError: true,
      errorExplanation:
        'This is an out-of-network provider at an in-network ER. The No Surprises Act (2022) protects you - you can only be charged your in-network cost-sharing.',
      legitimateExplanation: null,
    },
    {
      id: 6,
      description: 'CBC with Differential',
      cpt: '85025',
      amount: 95,
      isError: false,
      errorExplanation: null,
      legitimateExplanation: 'Standard lab test, appears on the EOB.',
    },
    {
      id: 7,
      description: 'Deluxe Private Room Upgrade (3 days)',
      cpt: null,
      amount: 180,
      isError: true,
      errorExplanation:
        'Room upgrades require written patient authorization. Ask for this to be removed.',
      legitimateExplanation: null,
    },
    {
      id: 8,
      description: 'Prescribed Medications',
      cpt: null,
      amount: 5,
      isError: false,
      errorExplanation: null,
      legitimateExplanation:
        'Appears on the EOB (note the EOB allowed more than billed - this is a pricing adjustment, not an error).',
    },
  ] as BillLineItem[],
  eobLineItems: [
    {
      id: 'er',
      description: 'ER Facility',
      billed: 1850,
      allowed: 1400,
      planPaid: 1000,
      patientResponsibility: 400,
    },
    {
      id: 'ct',
      description: 'CT Head',
      billed: 1100,
      allowed: 850,
      planPaid: 600,
      patientResponsibility: 250,
    },
    {
      id: 'iv',
      description: 'IV Hydration',
      billed: 140,
      allowed: 100,
      planPaid: 75,
      patientResponsibility: 25,
    },
    {
      id: 'anesthesia',
      description: 'Anesthesia (NSA-protected)',
      allowed: 400,
      planPaid: 300,
      patientResponsibility: 100,
    },
    {
      id: 'cbc',
      description: 'CBC Lab',
      billed: 95,
      allowed: 80,
      planPaid: 60,
      patientResponsibility: 20,
    },
    {
      id: 'meds',
      description: 'Medications',
      billed: 5,
      allowed: 120,
      planPaid: 65,
      patientResponsibility: 55,
    },
  ] as EobLineItem[],
  eobTotals: {
    allowed: 2950,
    planPaid: 2100,
    patientResponsibility: 850,
  },
  assistanceOptions: [
    {
      id: 1,
      label: 'Apply for hospital financial help (charity care)',
      recommendation: 'Strong fit',
      explanation:
        'Good choice. Nonprofit hospitals often have charity-care programs that can reduce or erase part of the bill.',
    },
    {
      id: 2,
      label: 'Ask for a monthly payment plan with no interest',
      recommendation: 'Strong fit',
      explanation:
        'Good choice. A no-interest plan can make payments manageable and helps avoid credit card debt.',
    },
    {
      id: 3,
      label: 'Ask for a discount if paying now (if they can pay right away)',
      recommendation: 'Only if they can pay up front',
      explanation:
        'Good option in the right situation. Some providers lower the total if the patient can pay a lump sum quickly.',
    },
    {
      id: 4,
      label: 'File a No Surprises Act complaint for the out-of-network anesthesia bill',
      recommendation: 'Strong fit',
      explanation:
        'Good choice. The No Surprises Act protects patients from many out-of-network surprise bills in emergencies.',
    },
    {
      id: 5,
      label: 'Apply for Medicaid backdated coverage (if income qualifies)',
      recommendation: 'Only if income-eligible',
      explanation:
        'Good option if eligible. Retroactive Medicaid can sometimes cover recent medical bills from the past months.',
    },
  ] as AssistanceOption[],
}

export const recommendedAssistanceStrongFits = [1, 2, 4]
