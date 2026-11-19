/* oxlint-disable react/rules-of-hooks */
import { Link, useLocation, useParams } from 'react-router'
import { LuArrowLeft as luArrowLeft } from 'react-icons/lu'
import * as componentComponents from '@/components'
import * as clientFichaComponents from './clientFicha'
import type { ClientResponse } from '../model/clientTypes'
import './clientFeature.css'

export const clientDetailPage = () => {
  const { clientId: rawClientId } = useParams()
  const location = useLocation()
  const seededClient = (location.state as { client?: ClientResponse } | null)?.client

  return (
    <>
      <div className="clientFeature__detailNav">
        <Link to="/clients" viewTransition className="clientFeature__backLink">
          <componentComponents.icon icon={luArrowLeft} size="sm" />
          Directorio de clientes
        </Link>
      </div>

      <clientFichaComponents.clientFicha
        clientId={rawClientId}
        initialClient={seededClient}
        avatarTransitionName={
          seededClient ? `client-avatar-${seededClient.id}` : undefined
        }
      />
    </>
  )
}
