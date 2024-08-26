'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TemplateVarPanel, { PanelTitle, VarOpBtnGroup } from '../value-panel'
import s from './style.module.css'
import { AppInfoComp, ChatBtn, EditBtn, FootLogo, PromptTemplate } from './massive-component'
import type { AppInfo, PromptConfig } from '@/types/app'
import Toast from '@/app/components/base/toast'
import Select from '@/app/components/base/select'
import { DEFAULT_VALUE_MAX_LEN } from '@/config'

// regex to match the {{}} and replace it with a span
const regex = /\{\{([^}]+)\}\}/g

export type IWelcomeProps = {
  conversationName: string
  hasSetInputs: boolean
  isPublicVersion: boolean
  siteInfo: AppInfo
  promptConfig: PromptConfig
  onStartChat: (inputs: Record<string, any>) => void
  canEditInputs: boolean
  savedInputs: Record<string, any>
  onInputsChange: (inputs: Record<string, any>) => void
  /** 传递默认值 */
  onDefaultQuery: (input: string) => void
}
const questionCard = [
  {
    title: '一级建筑师',
    questions: ['下列控制空气污染的措施中，在时间顺序上应优先考虑的是:() A.采用自然同分措施 B.建筑空间布局设计有利于污染物的排放 C.在用地勘察阶段注意土壤中放射性氡元素的含量 D.在建筑主体、防火材料、装修材料的选择上，尽量选用高技术、低污染的方案', '国历史文化遗产保护体系的三个层次是:() A.单体文物、历史文化保护区、历史文化名城;B.单体文物、群体文物、整体文物;C.国家级文物、省级文物、市级文物;D.保护文物、保留文物、修复文物']
  },
  {
    title: '一级建造师',
    questions: ['根据《建设工程工程量清单计价规范》规定，代表专业工程的项目编码是()。 A.1 、2 B.3 、4 C.5 、6 D.7 、8 、9', '关于施工图预算对施工单位作用说法正确的有()。 A. 可作为确定最高投标报价的依据 B. 可作为确定投标报价的参考依据 C. 可作为进行施工准备的依据 D. 可作为控制工程成本的依据 E. 可作为安排建设资金计划的依据']
  },
  {
    title: '二级建造师',
    questions: ['在矩阵组织结构中，工作的指令来源会有（）个。A.1 B.2 C.3 D.4', '编制成本计划作为成本计划编制的依据，以下属于成本编制依据的有（）。 A.合同文件 B.设计文件 C.施工组织设计 D.合同计价方式 E.价格信息']
  }
]

const Welcome: FC<IWelcomeProps> = ({
  conversationName,
  hasSetInputs,
  isPublicVersion,
  siteInfo,
  promptConfig,
  onStartChat,
  canEditInputs,
  savedInputs,
  onDefaultQuery,
  onInputsChange,
}) => {
  const { t } = useTranslation()
  const hasVar = promptConfig.prompt_variables.length > 0
  const [isFold, setIsFold] = useState<boolean>(true)
  const [inputs, setInputs] = useState<Record<string, any>>((() => {
    if (hasSetInputs)
      return savedInputs

    const res: Record<string, any> = {}
    if (promptConfig) {
      promptConfig.prompt_variables.forEach((item) => {
        res[item.key] = ''
      })
    }
    return res
  })())

  useEffect(() => {
    if (!savedInputs) {
      const res: Record<string, any> = {}
      if (promptConfig) {
        promptConfig.prompt_variables.forEach((item) => {
          res[item.key] = ''
        })
      }
      setInputs(res)
    }
    else {
      setInputs(savedInputs)
    }
  }, [savedInputs])

  const highLightPromoptTemplate = (() => {
    if (!promptConfig)
      return ''
    const res = promptConfig.prompt_template.replace(regex, (match, p1) => {
      return `<span class='text-gray-800 font-bold'>${inputs?.[p1] ? inputs?.[p1] : match}</span>`
    })
    return res
  })()

  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const renderHeader = () => {
    return (
      <div className='absolute top-0 left-0 right-0 flex items-center justify-between border-b border-gray-100 mobile:h-12 tablet:h-16 px-8 bg-white'>
        <div className='text-gray-900'>{conversationName}</div>
      </div>
    )
  }

  const renderInputs = () => {
    return (
      <div className='space-y-3'>
        {promptConfig.prompt_variables.map(item => (
          <div className='tablet:flex items-start mobile:space-y-2 tablet:space-y-0 mobile:text-xs tablet:text-sm' key={item.key}>
            <label className={`flex-shrink-0 flex items-center tablet:leading-9 mobile:text-gray-700 tablet:text-gray-900 mobile:font-medium pc:font-normal ${s.formLabel}`}>{item.name}</label>
            {item.type === 'select'
              && (
                <Select
                  className='w-full'
                  defaultValue={inputs?.[item.key]}
                  onSelect={(i) => { setInputs({ ...inputs, [item.key]: i.value }) }}
                  items={(item.options || []).map(i => ({ name: i, value: i }))}
                  allowSearch={false}
                  bgClassName='bg-gray-50'
                />
              )}
            {item.type === 'string' && (
              <input
                placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
                className={'w-full flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50'}
                maxLength={item.max_length || DEFAULT_VALUE_MAX_LEN}
              />
            )}
            {item.type === 'paragraph' && (
              <textarea
                className="w-full h-[104px] flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50"
                placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
              />
            )}
          </div>
        ))}

      </div>
    )
  }

  const canChat = () => {
    const inputLens = Object.values(inputs).length
    const promptVariablesLens = promptConfig.prompt_variables.length
    const emptyInput = inputLens < promptVariablesLens || Object.values(inputs).filter(v => v === '').length > 0
    if (emptyInput) {
      // logError(t('app.errorMessage.valueOfVarRequired'))
      setInputs({ ...inputs, sys_online: "开启" })
      // return true
    }
    return true
  }

  const handleChat = () => {
    if (!canChat())
      return
    onStartChat(inputs)
  }

  const handleQueClick = (val: string) => {
    if (!canChat())
      return
    onDefaultQuery(val)
    setInputs({ ...inputs, sys_online: "开启" })
    onStartChat(inputs)
  }
  const renderNoVarPanel = () => {
    if (isPublicVersion) {
      return (
        <div>

          <AppInfoComp siteInfo={siteInfo} />
          <TemplateVarPanel
            isFold={false}
            header={
              <>
                <PanelTitle
                  title={t('app.chat.publicPromptConfigTitle')}
                  className='mb-1'
                />
                <PromptTemplate html={highLightPromoptTemplate} />
              </>
            }
          >
            {/* {rederDefaultQue()} */}
            <ChatBtn onClick={handleChat} />
          </TemplateVarPanel>
        </div>
      )
    }
    // private version
    return (
      <TemplateVarPanel
        isFold={false}
        header={
          <AppInfoComp siteInfo={siteInfo} />
        }
      >
        <ChatBtn onClick={handleChat} />
        {rederDefaultQue()}
      </TemplateVarPanel>
    )
  }
  const rederDefaultQue = () => {
    console.log('question rendered');
    return (
      <div>
        {
          !isPublicVersion && (
            <div className='mx-auto pc:w-[1000px] max-w-full mobile:w-full px-3.5'>
              <p className='my-auto font-semibold'>你可以尝试下面的示例...</p>
              <div className='flex mt-10 gap-6 mb-10 justify-between items-strench'>
                {
                  questionCard.map((item, index) => (
                    <div key={index} className='flex-1  ring-2 items-center ring-gray-900/5 hover:ring-blue-600  py-2 shadow-md sm:rounded-md h-70'>
                      <h2 className='font-bold border-b text-lg p-2 text-center' >{item.title}</h2>
                      {item.questions.map((que, i) => (
                        <p key={i} className='hover:bg-gray-200 content-center min-h-52 flex justify-evenly items-center rounded-sm bg-gray-100 cursor-pointer p-2 m-2' onClick={() => handleQueClick(que)}>{que}</p>
                      ))}
                    </div>
                  ))
                }
              </div>
            </div>
          )
        }
      </div>
    )
  }
  const renderVarPanel = () => {
    return (
      <TemplateVarPanel
        isFold={false}
        header={
          <AppInfoComp siteInfo={siteInfo} />
        }
      >
        {renderInputs()}
        <ChatBtn
          className='mt-3 mobile:ml-0 tablet:ml-auto'
          onClick={handleChat}
        />
        {rederDefaultQue()}
      </TemplateVarPanel>
    )
  }

  const renderVarOpBtnGroup = () => {
    return (
      <VarOpBtnGroup
        onConfirm={() => {
          if (!canChat())
            return

          onInputsChange(inputs)
          setIsFold(true)
        }}
        onCancel={() => {
          setInputs(savedInputs)
          setIsFold(true)
        }}
      />
    )
  }

  const renderHasSetInputsPublic = () => {
    if (!canEditInputs) {
      return (
        <TemplateVarPanel
          isFold={false}
          header={
            <>
              <PanelTitle
                title={t('app.chat.publicPromptConfigTitle')}
                className='mb-1'
              />
              <PromptTemplate html={highLightPromoptTemplate} />
            </>
          }
        />
      )
    }

    return (
      <TemplateVarPanel
        isFold={isFold}
        header={
          <>
            <PanelTitle
              title={t('app.chat.publicPromptConfigTitle')}
              className='mb-1'
            />
            <PromptTemplate html={highLightPromoptTemplate} />
            {isFold && (
              <div className='flex items-center justify-between mt-3 border-t border-indigo-100 pt-4 text-xs text-indigo-600'>
                <span className='text-gray-700'>{t('app.chat.configStatusDes')}</span>
                <EditBtn onClick={() => setIsFold(false)} />
              </div>
            )}
          </>
        }
      >
        {renderInputs()}
        {renderVarOpBtnGroup()}
      </TemplateVarPanel>
    )
  }

  const renderHasSetInputsPrivate = () => {
    if (!canEditInputs || !hasVar)
      return null

    return (
      <TemplateVarPanel
        isFold={isFold}
        header={
          <div className='flex items-center justify-between text-indigo-600'>
            <PanelTitle
              title={!isFold ? t('app.chat.privatePromptConfigTitle') : t('app.chat.configStatusDes')}
            />
            {isFold && (
              <EditBtn onClick={() => setIsFold(false)} />
            )}
          </div>
        }
      >
        {renderInputs()}
        {renderVarOpBtnGroup()}
      </TemplateVarPanel>
    )
  }

  const renderHasSetInputs = () => {
    if ((!isPublicVersion && !canEditInputs) || !hasVar)
      return null

    return (
      <div
        className='pt-[88px] mb-5'
      >
        {isPublicVersion ? renderHasSetInputsPublic() : renderHasSetInputsPrivate()}
      </div>)
  }

  return (
    <div className='relative mobile:min-h-[48px] tablet:min-h-[64px]'>
      {hasSetInputs && renderHeader()}
      <div className='mx-auto pc:w-[1000px] max-w-full mobile:w-full px-3.5'>
        {/*  Has't set inputs  */}
        {
          !hasSetInputs && (
            <div className='mobile:pt-[72px] tablet:pt-[128px] pc:pt-[200px]'>
              {hasVar
                ? (
                  renderVarPanel()
                )
                : (
                  rederDefaultQue()
                  &&
                  renderNoVarPanel()

                )}
            </div>
          )
        }

        {/* Has set inputs */}
        {hasSetInputs && renderHasSetInputs()}
        {/* {hasSetInputs && rederDefaultQue()} */}
        {/* foot */}
        {!hasSetInputs && (
          <div className='mt-4 flex justify-between items-center h-8 text-xs text-gray-400'>

            {siteInfo.privacy_policy
              ? <div>{t('app.chat.privacyPolicyLeft')}
                <a
                  className='text-gray-500'
                  href={siteInfo.privacy_policy}
                  target='_blank'>{t('app.chat.privacyPolicyMiddle')}</a>
                {t('app.chat.privacyPolicyRight')}
              </div>
              : <div>
              </div>}
            {/* <a className='flex items-center pr-3 space-x-3' href="https://dify.ai/" target="_blank">
              <span className='uppercase'>{t('app.chat.powerBy')}</span>
              <FootLogo />
            </a> */}
          </div>
        )}
      </div>
    </div >
  )
}

export default React.memo(Welcome)
