import { HelperLogger } from 'coc-helper'
import {
  CompletionList,
  Document,
  ExtensionContext,
  LanguageClient,
  Position,
  StatusBarItem,
  TextEdit,
  commands,
  services,
  window,
  workspace,
} from 'coc.nvim'

const logger = new HelperLogger('coc-rime-ls')

const getCocConfig = () => workspace.getConfiguration('coc-rime-ls')
const getConfig = () => workspace.getConfiguration('rime-ls')

const updateStatusBarItem = (
  statusBarItem: StatusBarItem,
  enabled: boolean,
) => {
  if (enabled) {
    const cocConfig = getCocConfig()
    statusBarItem.text = cocConfig.get('statusBar', 'Rime')
    statusBarItem.show()
  } else {
    statusBarItem.hide()
  }
}

const createLanguageClient = () => {
  const config = getConfig()
  const cocConfig = getCocConfig()
  const initializationOptions = { ...config }
  logger.prettyPrint(initializationOptions)
  for (const [key, value] of Object.entries(initializationOptions)) {
    if (value === null) delete initializationOptions[key]
  }
  const command = cocConfig.get<string>('command', 'rime_ls')
  return new LanguageClient(
    'rime-ls',
    'Rime Language Client',
    {
      command,
    },
    {
      documentSelector: ['*'],
      initializationOptions,
    },
  )
}

const applyEdit = async (doc: Document, textEdit: TextEdit) => {
  const startPos = textEdit.range.start
  const newPos: Position = {
    line: startPos.line,
    character: startPos.character + textEdit.newText.length,
  }
  await workspace.applyEdit({
    changes: {
      [doc.uri]: [textEdit],
    },
  })
  await window.moveTo(newPos)
  return true
}

const registerCommand = <T>(
  command: string,
  impl: (...args: any[]) => Promise<T>,
  internal?: boolean,
) => commands.registerCommand(command, impl as any, internal)

exports.activate = function activate(context: ExtensionContext) {
  const config = getConfig()
  let enabled = config.get<boolean>('enabled', false)
  const statusBarItem = window.createStatusBarItem(1)
  updateStatusBarItem(statusBarItem, enabled)
  const languageClient = createLanguageClient()
  languageClient.start().catch(logger.error)
  languageClient
    .onReady()
    .then(() => {
      context.subscriptions.push(
        statusBarItem,
        services.registerLanguageClient(languageClient),
        registerCommand('coc-rime-ls.toggle', async () => {
          enabled = await languageClient.sendRequest(
            'workspace/executeCommand',
            {
              command: 'rime-ls.toggle-rime',
            },
          )
          updateStatusBarItem(statusBarItem, enabled)
          return enabled
        }),
        registerCommand(
          'coc-rime-ls.completion_with_first',
          async () => {
            const doc = await workspace.document
            const pos = await window.getCursorPosition()
            const result: CompletionList | null =
              await languageClient.sendRequest('textDocument/completion', {
                context: { triggerKind: 1 },
                textDocument: { uri: doc.uri },
                position: { line: pos.line, character: pos.character },
              })
            if (!result) return false
            const item = result.items.at(0)
            if (!item) return false
            if (item.textEdit) return await applyEdit(doc, item.textEdit)
            else if (item.insertText)
              return await applyEdit(doc, {
                newText: item.insertText,
                range: {
                  start: pos,
                  end: pos,
                },
              })
            return false
          },
          true,
        ),
      )
    })
    .catch(logger.error)
}
