# n8n-nodes-_node-name_

This is an n8n community node. It lets you use _app/service name_ in your n8n workflows.

_App/service name_ is _one or two sentences describing the service this node integrates with_.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Configuration](#configuration)
[Operations](#operations)  
[Credentials](#credentials)  <!-- delete if no auth needed -->  
[Compatibility](#compatibility)  
[Usage](#usage)  <!-- delete if not using this section -->  
[Resources](#resources)  
[Version history](#version-history)  <!-- delete if not using this section -->  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Configuration

### Changing Repository Name

To change the repository name, you need to update two files:

1. Update the `REPO_NAME` variable in the `.env` file:

```bash
# .env file
REPO_NAME=your-custom-repo-name
```

2. Update the following fields in `package.json` to match your repository name:

```json
{
  "name": "n8n-nodes-your-custom-repo-name",
  ...
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/n8n-nodes-your-custom-repo-name.git"
  },
  ...
}
```

Make sure:
- The `name` field follows the format `n8n-nodes-[your-custom-repo-name]`
- The repository URL is updated with your GitHub username and repository name
- Both values match the `REPO_NAME` in the `.env` file

### Deployment

To deploy the node, run the following command:

```bash
pnpm run deploy
```

This command will:
1. Compile TypeScript files
2. Build icons
3. Start the Docker containers using docker-compose

The deployment uses Docker Compose to set up an n8n instance with your custom nodes. The Docker Compose configuration:
- Uses the latest n8n image
- Exposes n8n on port 5000
- Mounts your compiled node code into the n8n container
- Uses the repository name from the `.env` file to properly mount your custom nodes

After deployment, you can access n8n at http://localhost:5000

## Operations

_List the operations supported by your node._

## Credentials

_If users need to authenticate with the app/service, provide details here. You should include prerequisites (such as signing up with the service), available authentication methods, and how to set them up._

## Compatibility

_State the minimum n8n version, as well as which versions you test against. You can also include any known version incompatibility issues._

## Usage

_This is an optional section. Use it to help users with any difficult or confusing aspects of the node._

_By the time users are looking for community nodes, they probably already know n8n basics. But if you expect new users, you can link to the [Try it out](https://docs.n8n.io/try-it-out/) documentation to help them get started._

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* _Link to app/service documentation._

## Version history

_This is another optional section. If your node has multiple versions, include a short description of available versions and what changed, as well as any compatibility impact._


