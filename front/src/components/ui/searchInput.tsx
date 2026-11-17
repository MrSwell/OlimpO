import { LuSearch as luSearch } from 'react-icons/lu'
import * as inputComponents from './input'
import type { InputProps } from './input'

export const searchInput = (props: InputProps) => {
  return <inputComponents.input type="search" icon={luSearch} {...props} />
}
