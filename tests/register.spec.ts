import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

import { LoginPage } from '../pages/login.page'
import { DashPage } from '../pages/dash.page'
import { RegisterPage } from '../pages/register.page'

import { NavBar } from '../pages/components/navbar'
import { Toast } from '../pages/components/toast'

import { Mission } from '../support/types'

import { deleteReservation, deleteTicket, deleteMission, insertMission } from '../support/db'

//variáveis
let loginPage: LoginPage
let dashPage: DashPage
let registerPage: RegisterPage
let navbar: NavBar
let toast: Toast

//hooks para aproveitamento de código (zera duplicidade)
//use quanto a tela e funcionalidades tiverem o mesmo ou similar comportamento
test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page)
  dashPage = new DashPage(page)
  registerPage = new RegisterPage(page)

  navbar = new NavBar(page)
  toast = new Toast(page)

  //Arrange  -preparação do cenário
  await loginPage.go()
  await loginPage.login('buzz@lunarpass.dev', 'pwd123')
  await expect(navbar.logout).toBeVisible({ timeout: 10_0000 })

})

test('deve cadastrar uma nova missão', async ({ page }) => {

  //conceito de contrato a partir de uma interface
  const mission: Mission = {
    //nessa aula retiramos o faker, fixamos a mesma missão, 
    // mas subimos para dentro do arrange do teste os deletes
    //ou seja, aqui gero a massa de teste...
    id: 'LP-0128A',
    rocket: 'Starship',
    baseId: 'aurora',
    departureDate: '2028-01-20',
    //returnDate: '27 de jan. de 2028',
    returnDate: '2028-01-27',
    price: 1000.00
  }

  //controle da massa de testes. //garanto que ela nunca existiu no bd...
  await deleteReservation(mission.id)
  await deleteTicket(mission.id)
  await deleteMission(mission.id)

  await dashPage.addButton.click()
  await expect(registerPage.title).toBeVisible()
  await registerPage.submit(mission)//cadastro a massa de teste...

  await expect(toast.message).toContainText('Missão criada.')//valido o registro da massa de teste no bd!
})

test('não deve cadastrar com código de missão incorreto', async ({ page }) => {
  //conceito de contrato a partir de uma interface
  const mission: Mission = {
    id: faker.string.alphanumeric({ length: { min: 5, max: 5 }, casing: 'upper' }),
    rocket: 'Starship',
    baseId: 'aurora',
    departureDate: '2028-01-20',
    //returnDate: '27 de jan. de 2028',
    returnDate: '2028-01-27',
    price: 1000.00
  }

  await dashPage.addButton.click()
  await expect(registerPage.title).toBeVisible()
  await registerPage.submit(mission)

  await expect(registerPage.alert).toHaveText('Use o formato LP-0000')
})

//ESSE TESTE REQUER CUIDADO EM GARANTIR A INTEGRIDADE DA MASSA (PKs e FKs)!
test('não deve cadastrar com código duplicado', async ({ page }) => {
  //Arrange
  //conceito de contrato a partir de uma interface
  const mission: Mission = {
    id: 'LP-DUP01',
    rocket: 'Enterprise',
    baseId: 'alpha',
    departureDate: '2028-01-20',
    //returnDate: '27 de jan. de 2028',
    returnDate: '2028-01-27',
    price: 2500.00
  }

  //controle da massa de testes.
  await deleteReservation(mission.id)
  await deleteTicket(mission.id)
  await deleteMission(mission.id)
  await insertMission(mission)

  //Act
  await dashPage.addButton.click()
  await expect(registerPage.title).toBeVisible()
  await registerPage.submit(mission)

  //Assert
  await expect(registerPage.alert).toHaveText('Já existe uma missão com este ID.')
})

