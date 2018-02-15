# Fifa 2018 Example

This example uses the following open data set on Kraggle:

<https://www.kaggle.com/kevinmh/fifa-18-more-complete-player-dataset/data>

This data set contains information on every player in the `Fifa 2018` video game. We're going to use this data (all 17,994 players) to demonstrate how you would use Udaru to manage access to hypothetical application - a web based Portal that Fifa offers to it's Clubs to manage Player Profiles, i.e. stats & other KPI's in the above data set.

This document is also a good template to follow when defining and documenting your Access Model, i.e. defining your authorization requirements, a Role Matrix, your Resources, Actions and Policies. 


## Organization Hierarchy 

The sample data set will be imported into Udaru under the following hierarchy:

```
├── Fifa 
|  ├── National Leagues 
|     ├── <league> 
|        ├── <division> 
|           ├── <club team> 
|              ├──<player> 
|  ├── International Teams
|     ├── <national team> 
|        ├──<player> 
```

All players are imported as Users in Udaru and are placed in their associated club and national teams. User entries will also be created for the following additional users types of our system:

*   Fifa Admin
*   League Admin
*   Division Admin
*   Club Admin
*   National Admin
*   International Admin

## Access Requirements

Here are the business rules for our hypothetical application:
*   Players can view their own data and everyone on their team
*   Players can update their own data
*   Club Admin users can make updates to any player in their club
*   Division Admin users can make updates to any clubs in their division
*   League Admins can make any updates to any divisions in their league
*   Fifa Admins can make any updates to any leagues, i.e. they are effectively super users

The above are effectively all static authorization roles. To make things a little interesting, we'll also cover how manage dynamic policies: 

*   Players can share their profile with other Players in different clubs (like Facebook/LinkedIn)

## Role Matrix

The following is the above requirements expressed in a Role Matrix

| Feature                | Player   | Club Admin     | Division Admin   | League Admin   | National Admin | International Admin | Fifa Admin   |
| -------                | :------: | :------------: | :--------------: | :------------: | :------------: | :-----------------: | :----------: |
| View Player Profile    | X        | X              | X                | X              | X              | X                   | X            |
| Edit Player Profile    | X        | X              |                  |                |                |                     |              |
| Manage Club            |          | X              |                  |                |                |                     | X            |
| Manage Clubs           |          |                | X                | X              |                |                     | X            |
| Manage Divisions       |          |                |                  | X              |                |                     | X            |
| Manage Leagues         |          |                |                  |                |                |                     | X            |
| Manage National Team   |          |                |                  |                | X              |                     | X            |
| Manage National Teams  |          |                |                  |                |                | X                   | X            |
| Share/un-share profile | X        |                |                  |                |                |                     |              |

## Resources

The following is the proposed Resource URI format for supporting the above. Note we use `:` as the path delimiter.

| Resource                                                 | Description                                               | Example                                                                          |
| --------                                                 | -----------                                               | -------                                                                          |
| international:<national-team-id\>:players:<player-id\>   | URI structure representing national teams                 | international:portugal:players:20801-Cristiano-Ronaldo                           |
| national-league:<league\>:<division\>:<club\>:players:<player\> | URI structure representing leagues, divisions and players | national-league:spanish:Primear-Division:Real-Madrid-FC:players:20801-Cristiano-Ronaldo |
|                                                          |                                                           |                                                                                  |

## Actions 

The following is the proposed list of Actions that need to be supported in our hypothetical system:

| Action                | Description                                                  |
| ------                | -----------                                                  |
| player:view           | View player profile                                          |
| player:edit           | Edit player profile                                          |
| club:edit             | Edit club information, including adding/removing players     |
| clubs:add             | Add a club                                                   |
| clubs:remove          | Remove a club                                                |
| divisions:add         | Add a division                                               |
| divisions:remove      | Remove a division                                            |
| leagues:add           | Add a league                                                 |
| leagues:remove        | Remove a league                                              |
| national:edit         | Edit national team information, including add/remove players |
| internationals:add    | Add a national team                                          |
| internationals:remove | Remove a national team                                       |


## Policies

