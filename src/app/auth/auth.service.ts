import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Subject } from 'rxjs'

import { AuthData } from './auth.data'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token!: string
  private isAuthenticated = false
  private authStatusListener = new Subject<boolean>()
  private tokenTimer!: NodeJS.Timer

  constructor (private http: HttpClient, private router: Router) {}

  createUser (email: string, password: string) {
    const authData: AuthData = { email: email, password: password }
    this.http
      .post('http://localhost:3000/api/user', authData)
      .subscribe(res => {
        console.log(res)
        this.router.navigate(['/login'])
      })
  }

  getToken () {
    return localStorage.getItem('token')
  }

  getIsAuth () {
    return this.isAuthenticated
  }

  getAuthStatusListener () {
    return this.authStatusListener.asObservable()
  }

  login (email: string, password: string) {
    const authData: AuthData = { email: email, password: password }
    this.http
      .post<{ token: string; expiresIn: number }>(
        'http://localhost:3000/api/user/login',
        authData
      )
      .subscribe(response => {
        const token = response.token
        if (token) {
          const expiresInDuration = response.expiresIn
          console.log('Duração' + expiresInDuration)
          this.setAuthTimer(expiresInDuration)
          this.isAuthenticated = true

          this.authStatusListener.next(true)
          const now = new Date()
          const expirationDate = new Date(
            now.getTime() + expiresInDuration * 1000
          )
          console.log(expirationDate)
          this.saveAuthData(token, expirationDate)
          this.router.navigate(['/'])
        }
      })
  }

  autoAuthUser () {
    const authInformation = this.getAuthData()
    if (!authInformation) {
      return
    }
    const now = new Date()
    const expiresIn = authInformation!.expirationDate.getTime() - now.getTime()

    if (expiresIn > 0) {
      this.token = authInformation!.token
      this.isAuthenticated = true
      this.setAuthTimer(expiresIn / 1000)
      this.authStatusListener.next(true)
    }
  }

  private setAuthTimer (duration: number) {
    console.log('setting timer : ' + duration)
    this.tokenTimer = setTimeout(() => {
      this.logout()
    }, duration)
  }
  logout () {
    this.isAuthenticated = false
    this.authStatusListener.next(false)
  }
  private saveAuthData (token: string, expirationDate: Date) {
    localStorage.setItem('token', token)
    localStorage.setItem('expiration', expirationDate.toISOString())
  }

  private getAuthData () {
    const token = localStorage.getItem('token')
    const expirationDate = localStorage.getItem('expiration')
    if (!token || !expirationDate) {
      return
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate)
    }
  }
}
