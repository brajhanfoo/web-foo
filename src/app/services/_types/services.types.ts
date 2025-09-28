import { IconType } from 'react-icons'

export interface Service {
  title: string
  description: string
  icon: IconType
}

export interface Testimonial {
  id: number 
  name: string
  position: string
  company: string
  testimonial: string
  image: string | null 
  stars?: 1 | 2 | 3 | 4 | 5 
}
