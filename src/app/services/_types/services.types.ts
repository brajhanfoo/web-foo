import { IconType } from 'react-icons'

export interface Service {
  title: string
  description: string
  icon: IconType
}

export interface Testimonio {
  id: number
  nombre: string
  rol: string
  opinion: string
  estrellas: number
  imagen: string
}
