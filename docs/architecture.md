```mermaid
---
config:
  flowchart:
    htmlLabels: false
---
flowchart LR

    classDef warning fill:#f76808
    classDef suggest fill:#4DE865
        
    subgraph Unlogged_Area
    loginPage["Login Page (start)"]
    register["Register Page"]
    end
    
    subgraph Logged_Area

        subgraph Home_Area
            home["Home"]
            content["Conteúdo da Home"]
        end

        subgraph Wallet_Area
            wallet["Wallet"]
            money_io["Deposit/Withdraw"]
            balances["Balances"]
            statements["Statements"]
            
        end
    
        subgraph Market_Area
            market["Market"]
            orders["Orders"]
            stocks["Stocks"]
        end
    
        subgraph Settings_Area
            settings["Settings"]
            user_perfil["Data"]
            auth["Authentication"]
        end
    
    loginPage -->|log in| home
    loginPage -->|create Account| register
    register -->|back| loginPage
    register -->|make register| home
    
    home --> wallet
    home --> market
    home --> settings
    
    home --- content:::warning

    wallet --- money_io:::warning
    wallet --- balances:::warning
    wallet --- statements:::suggest

    market --- orders:::suggest
    market --- stocks

    settings --- user_perfil
    settings --- auth
    
    end
```