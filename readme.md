# coc-rime-ls

## 安装

- 安装 [rime-ls](https://github.com/wlh320/rime-ls) 命令
- 安装 coc-rime-ls `CocInstall coc-rime-ls`

开关输入法

`:call CocAction('runCommand', 'coc-rime-ls.toggle')`

## 配置

使用 `ctrl+t` 开关输入法，并用空格补全

```vim
function! RimeToggle()
  let rime_enable = CocAction('runCommand', 'coc-rime-ls.toggle')
  if rime_enable
    inoremap <silent> <Space> <C-r>=RimeConfirm()<CR>
    echomsg 'Rime enable'
  else
    iunmap <silent><expr> <Space>
    echomsg 'Rime disable'
  endif
  return ''
endfunction

function! RimeConfirm()
  let result = CocAction('runCommand', 'coc-rime-ls.completion_with_first')
  if result is v:false
    return "\<Space>"
  endif
  return ''
endfunction

command! RimeToggle call RimeToggle()

nmap <C-t> :RimeToggle<CR>
imap <expr> <C-t> RimeToggle()
```

配置 rime-ls 路径

```vim
call coc#config('coc-rime-ls.command', 'rime_ls')
```

配置 rime-ls 配置项

```vim
call coc#config('rime-ls.enabled', v:true)
call coc#config('rime-ls.shared_data_dir', '/usr/share/rime-data')
```

配置 nerdfont 状态栏

```vim
if nerdfont
  call coc#config('coc-rime-ls.statusBar', '')
endif
```

## License

MIT
