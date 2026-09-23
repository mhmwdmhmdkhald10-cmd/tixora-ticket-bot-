const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");

// =====================================================
// CONFIG
// =====================================================

const TOKEN = process.env.TOKEN;

const BOT_NAME = "Tixora";
const SUPPORT_SERVER = "https://discord.gg/HuJnqstD8";

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================================================
// DATA
// =====================================================

const DATA_FILE = "./data.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ guilds: {} }, null, 2)
    );
  }

  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { guilds: {} };
  }
}

let data = loadData();

function saveData() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2)
  );
}

function getGuildData(guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      categoryId: null,
      staffRoleId: null,
      ticketLimit: 1,
      ticketName: "ticket-{username}",
      panelChannelId: null
    };

    saveData();
  }

  return data.guilds[guildId];
}

// =====================================================
// COMMANDS
// =====================================================

const commands = [

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("إدارة نظام التذاكر")

    // SETUP
    .addSubcommand(sub =>
      sub
        .setName("setup")
        .setDescription("إرسال لوحة فتح التذاكر")
    )

    // SETTINGS
    .addSubcommand(sub =>
      sub
        .setName("settings")
        .setDescription("عرض إعدادات التذاكر")
    )

    // CATEGORY
    .addSubcommand(sub =>
      sub
        .setName("category")
        .setDescription("تحديد كاتيجوري التذاكر")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("كاتيجوري التذاكر")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
    )

    // STAFF
    .addSubcommand(sub =>
      sub
        .setName("staff")
        .setDescription("تحديد رتبة الدعم")
        .addRoleOption(option =>
          option
            .setName("role")
            .setDescription("رتبة فريق الدعم")
            .setRequired(true)
        )
    )

    // LIMIT
    .addSubcommand(sub =>
      sub
        .setName("limit")
        .setDescription("تحديد عدد التذاكر لكل عضو")
        .addIntegerOption(option =>
          option
            .setName("amount")
            .setDescription("عدد التذاكر")
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(true)
        )
    )

    // NAME
    .addSubcommand(sub =>
      sub
        .setName("name")
        .setDescription("تحديد اسم التذكرة")
        .addStringOption(option =>
          option
            .setName("format")
            .setDescription("مثال: ticket-{username}")
            .setRequired(true)
        )
    )

    // PANEL
    .addSubcommand(sub =>
      sub
        .setName("panel")
        .setDescription("تحديد قناة لوحة التذاكر")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("قناة لوحة التذاكر")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )

    // CLOSE
    .addSubcommand(sub =>
      sub
        .setName("close")
        .setDescription("إغلاق التذكرة الحالية")
    )

    // DELETE
    .addSubcommand(sub =>
      sub
        .setName("delete")
        .setDescription("حذف التذكرة الحالية")
    )

    // CLAIM
    .addSubcommand(sub =>
      sub
        .setName("claim")
        .setDescription("استلام التذكرة")
    )

    // UNCLAIM
    .addSubcommand(sub =>
      sub
        .setName("unclaim")
        .setDescription("إلغاء استلام التذكرة")
    )

    // ADD
    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("إضافة عضو للتذكرة")
        .addUserOption(option =>
          option
            .setName("user")
            .setDescription("العضو")
            .setRequired(true)
        )
    )

    // REMOVE
    .addSubcommand(sub =>
      sub
        .setName("remove")
        .setDescription("إزالة عضو من التذكرة")
        .addUserOption(option =>
          option
            .setName("user")
            .setDescription("العضو")
            .setRequired(true)
        )
    )

    // RENAME
    .addSubcommand(sub =>
      sub
        .setName("rename")
        .setDescription("تغيير اسم التذكرة")
        .addStringOption(option =>
          option
            .setName("name")
            .setDescription("الاسم الجديد")
            .setRequired(true)
        )
    ),

  // SUPPORT
  new SlashCommandBuilder()
    .setName("support")
    .setDescription("رابط الدعم الفني")

];

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {

  console.log("=================================");
  console.log(`🤖 ${BOT_NAME} is online`);
  console.log(`👤 ${client.user.tag}`);
  console.log("=================================");

  client.user.setPresence({
    activities: [
      {
        name: "Tixora Tickets 🎫",
        type: 3
      }
    ],
    status: "online"
  });

  try {

    await client.application.commands.set(
      commands.map(command => command.toJSON())
    );

    console.log("✅ Slash commands registered");

  } catch (error) {

    console.error("❌ Command registration error:");
    console.error(error);

  }

});

// =====================================================
// PERMISSION HELPER
// =====================================================

function isAdmin(interaction) {

  return interaction.member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );

}

function isStaff(interaction) {

  const guildData = getGuildData(interaction.guild.id);

  if (!guildData.staffRoleId) {
    return isAdmin(interaction);
  }

  return (
    isAdmin(interaction) ||
    interaction.member.roles.cache.has(guildData.staffRoleId)
  );

}

// =====================================================
// TICKET CHECK
// =====================================================

function isTicketChannel(channel) {

  if (!channel) return false;

  return (
    channel.type === ChannelType.GuildText &&
    channel.topic &&
    channel.topic.startsWith("ticket-owner:")
  );

}

// =====================================================
// FIND USER TICKETS
// =====================================================

function getUserTickets(guild, userId) {

  return guild.channels.cache.filter(channel => {

    return (
      channel.type === ChannelType.GuildText &&
      channel.topic === `ticket-owner:${userId}`
    );

  });

}

// =====================================================
// CREATE TICKET NAME
// =====================================================

function createTicketName(format, user) {

  return format
    .replace(/{username}/gi, user.username)
    .replace(/{userid}/gi, user.id)
    .replace(/{displayname}/gi, user.displayName || user.username);

}

// =====================================================
// INTERACTION
// =====================================================

client.on("interactionCreate", async interaction => {

  try {

    // =================================================
    // BUTTONS
    // =================================================

    if (interaction.isButton()) {

      // ===============================================
      // OPEN TICKET
      // ===============================================

      if (interaction.customId === "tixora_create_ticket") {

        const guild = interaction.guild;
        const member = interaction.member;

        const guildData = getGuildData(guild.id);

        if (!guildData.categoryId) {

          return interaction.reply({
            content:
              "❌ لم يتم تحديد كاتيجوري التذاكر.\n" +
              "استخدم `/ticket category` أولًا.",
            ephemeral: true
          });

        }

        const category = guild.channels.cache.get(
          guildData.categoryId
        );

        if (!category) {

          return interaction.reply({
            content:
              "❌ كاتيجوري التذاكر المحددة غير موجودة.",
            ephemeral: true
          });

        }

        // =============================================
        // TICKET LIMIT
        // =============================================

        const userTickets = getUserTickets(
          guild,
          member.id
        );

        if (userTickets.size >= guildData.ticketLimit) {

          return interaction.reply({
            content:
              `❌ لديك بالفعل ${userTickets.size} تذكرة مفتوحة.\n` +
              `الحد الأقصى: ${guildData.ticketLimit}`,
            ephemeral: true
          });

        }

        // =============================================
        // STAFF ROLE
        // =============================================

        const permissionOverwrites = [

          {
            id: guild.roles.everyone.id,
            deny: [
              PermissionsBitField.Flags.ViewChannel
            ]
          },

          {
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.AttachFiles
            ]
          }

        ];

        if (guildData.staffRoleId) {

          permissionOverwrites.push({
            id: guildData.staffRoleId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageChannels
            ]
          });

        }

        // =============================================
        // CREATE CHANNEL
        // =============================================

        const ticketName = createTicketName(
          guildData.ticketName,
          member.user
        );

        const ticket = await guild.channels.create({

          name: ticketName.substring(0, 100),

          type: ChannelType.GuildText,

          parent: category.id,

          topic: `ticket-owner:${member.id}`,

          permissionOverwrites

        });

        // =============================================
        // EMBED
        // =============================================

        const embed = new EmbedBuilder()
          .setTitle("🎫 Tixora Ticket")
          .setDescription(
            `مرحبًا ${member} 👋\n\n` +
            "تم فتح تذكرتك بنجاح.\n" +
            "اكتب طلبك أو مشكلتك هنا وسيقوم فريق الدعم بمساعدتك.\n\n" +
            "🔒 يمكنك إغلاق التذكرة من الزر بالأسفل."
          )
          .setFooter({
            text: "Tixora Ticket System"
          });

        const buttons = new ActionRowBuilder()
          .addComponents(

            new ButtonBuilder()
              .setCustomId("tixora_claim_ticket")
              .setLabel("استلام")
              .setEmoji("📌")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId("tixora_close_ticket")
              .setLabel("إغلاق")
              .setEmoji("🔒")
              .setStyle(ButtonStyle.Danger)

          );

        let content = `${member}`;

        if (guildData.staffRoleId) {
          content += ` <@&${guildData.staffRoleId}>`;
        }

        await ticket.send({

          content,

          embeds: [embed],

          components: [buttons]

        });

        return interaction.reply({

          content:
            `✅ تم إنشاء تذكرتك بنجاح.\n${ticket}`,

          ephemeral: true

        });

      }

      // =============================================
      // CLAIM
      // =============================================

      if (interaction.customId === "tixora_claim_ticket") {

        if (!isTicketChannel(interaction.channel)) {

          return interaction.reply({
            content: "❌ هذا الزر يعمل داخل التذاكر فقط.",
            ephemeral: true
          });

        }

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ هذا الزر مخصص لفريق الدعم فقط.",
            ephemeral: true
          });

        }

        if (
          interaction.channel.topic.includes(
            `claimed-by:${interaction.user.id}`
          )
        ) {

          return interaction.reply({
            content:
              "❌ أنت مستلم هذه التذكرة بالفعل.",
            ephemeral: true
          });

        }

        await interaction.channel.setTopic(
          `${interaction.channel.topic}|claimed-by:${interaction.user.id}`
        );

        return interaction.reply({
          content:
            `📌 تم استلام التذكرة بواسطة ${interaction.user}.`
        });

      }

      // =============================================
      // CLOSE BUTTON
      // =============================================

      if (interaction.customId === "tixora_close_ticket") {

        if (!isTicketChannel(interaction.channel)) {

          return interaction.reply({
            content: "❌ هذه ليست تذكرة.",
            ephemeral: true
          });

        }

        const ownerId =
          interaction.channel.topic
            .split("|")[0]
            .replace("ticket-owner:", "");

        const canClose =
          interaction.user.id === ownerId ||
          isStaff(interaction);

        if (!canClose) {

          return interaction.reply({
            content:
              "❌ لا يمكنك إغلاق هذه التذكرة.",
            ephemeral: true
          });

        }

        await interaction.reply(
          "🔒 سيتم حذف التذكرة خلال 5 ثوانٍ..."
        );

        setTimeout(async () => {

          try {
            await interaction.channel.delete();
          } catch (error) {
            console.error(error);
          }

        }, 5000);

        return;

      }

      return;

    }

    // =================================================
    // SLASH COMMANDS
    // =================================================

    if (!interaction.isChatInputCommand()) return;

    // =================================================
    // SUPPORT
    // =================================================

    if (interaction.commandName === "support") {

      return interaction.reply({

        content:
          `🎫 **Tixora Support**\n${SUPPORT_SERVER}`,

        ephemeral: true

      });

    }

    if (interaction.commandName !== "ticket") return;

    const subcommand =
      interaction.options.getSubcommand();

    // =================================================
    // ADMIN SETTINGS
    // =================================================

    const settingCommands = [
      "category",
      "staff",
      "limit",
      "name",
      "panel"
    ];

    if (
      settingCommands.includes(subcommand) &&
      !isAdmin(interaction)
    ) {

      return interaction.reply({

        content:
          "❌ تحتاج إلى صلاحية Administrator لتعديل إعدادات Tixora.",

        ephemeral: true

      });

    }

    // =================================================
    // SETUP
    // =================================================

    if (subcommand === "setup") {

      if (!isAdmin(interaction)) {

        return interaction.reply({

          content:
            "❌ تحتاج إلى صلاحية Administrator.",

          ephemeral: true

        });

      }

      const embed = new EmbedBuilder()
        .setTitle("🎫 Tixora Support")
        .setDescription(
          "مرحبًا بك في نظام الدعم الفني.\n\n" +
          "اضغط على الزر بالأسفل لفتح تذكرة.\n\n" +
          "سيتم إنشاء قناة خاصة بك تلقائيًا."
        )
        .setFooter({
          text: "Tixora Ticket System"
        });

      const row = new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId("tixora_create_ticket")
            .setLabel("فتح تذكرة")
            .setEmoji("🎫")
            .setStyle(ButtonStyle.Primary)

        );

      const sentMessage =
        await interaction.channel.send({

          embeds: [embed],

          components: [row]

        });

      const guildData =
        getGuildData(interaction.guild.id);

      guildData.panelChannelId =
        interaction.channel.id;

      saveData();

      return interaction.reply({

        content:
          `✅ تم إنشاء لوحة Tixora.\n` +
          `📌 الرسالة: ${sentMessage.url}`,

        ephemeral: true

      });

    }

    // =================================================
    // SETTINGS
    // =================================================

    if (subcommand === "settings") {

      const guildData =
        getGuildData(interaction.guild.id);

      const category =
        guildData.categoryId
          ? `<#${guildData.categoryId}>`
          : "غير محددة";

      const staff =
        guildData.staffRoleId
          ? `<@&${guildData.staffRoleId}>`
          : "غير محددة";

      const panel =
        guildData.panelChannelId
          ? `<#${guildData.panelChannelId}>`
          : "غير محددة";

      const embed = new EmbedBuilder()
        .setTitle("⚙️ Tixora Settings")
        .addFields(

          {
            name: "📁 Category",
            value: category,
            inline: true
          },

          {
            name: "👥 Staff",
            value: staff,
            inline: true
          },

          {
            name: "🎫 Ticket Limit",
            value: `${guildData.ticketLimit}`,
            inline: true
          },

          {
            name: "📝 Ticket Name",
            value:
              `\`${guildData.ticketName}\``,
            inline: true
          },

          {
            name: "📌 Panel",
            value: panel,
            inline: true
          }

        )
        .setFooter({
          text: "Tixora Ticket System"
        });

      return interaction.reply({

        embeds: [embed],

        ephemeral: true

      });

    }

    // =================================================
    // CATEGORY
    // =================================================

    if (subcommand === "category") {

      const channel =
        interaction.options.getChannel("channel");

      const guildData =
        getGuildData(interaction.guild.id);

      guildData.categoryId = channel.id;

      saveData();

      return interaction.reply({

        content:
          `✅ تم تحديد كاتيجوري التذاكر: ${channel}`,

        ephemeral: true

      });

    }

    // =================================================
    // STAFF
    // =================================================

    if (subcommand === "staff") {

      const role =
        interaction.options.getRole("role");

      const guildData =
        getGuildData(interaction.guild.id);

      guildData.staffRoleId = role.id;

      saveData();

      return interaction.reply({

        content:
          `✅ تم تحديد رتبة الدعم: ${role}`,

        ephemeral: true

      });

    }

    // =================================================
    // LIMIT
    // =================================================

    if (subcommand === "limit") {

      const amount =
        interaction.options.getInteger("amount");

      const guildData =
        getGuildData(interaction.guild.id);

      guildData.ticketLimit = amount;

      saveData();

      return interaction.reply({

        content:
          `✅ الحد الأقصى للتذاكر أصبح: **${amount}**`,

        ephemeral: true

      });

    }

    // =================================================
    // NAME
    // =================================================

    if (subcommand === "name") {

      const format =
        interaction.options.getString("format");

      const guildData =
        getGuildData(interaction.guild.id);

      guildData.ticketName = format;

      saveData();

      return interaction.reply({

        content:
          `✅ تم تغيير اسم التذاكر إلى:\n\`${format}\``,

        ephemeral: true

      });

    }

    // =================================================
    // PANEL
    // =================================================

    if (subcommand === "panel") {

      const channel =
        interaction.options.getChannel("channel");

      const guildData =
        getGuildData(interaction.guild.id);

      guildData.panelChannelId = channel.id;

      saveData();

      return interaction.reply({

        content:
          `✅ تم تحديد قناة لوحة التذاكر: ${channel}`,

        ephemeral: true

      });

    }

    // =================================================
    // CHECK TICKET
    // =================================================

    if (!isTicketChannel(interaction.channel)) {

      return interaction.reply({

        content:
          "❌ هذا الأمر يعمل داخل التذاكر فقط.",

        ephemeral: true

      });

    }

    // =================================================
    // CLOSE
    // =================================================

    if (subcommand === "close") {

      const ownerId =
        interaction.channel.topic
          .split("|")[0]
          .replace("ticket-owner:", "");

      if (
        interaction.user.id !== ownerId &&
        !isStaff(interaction)
      ) {

        return interaction.reply({

          content:
            "❌ لا يمكنك إغلاق هذه التذكرة.",

          ephemeral: true

        });

      }

      await interaction.reply(
        "🔒 سيتم حذف التذكرة خلال 5 ثوانٍ..."
      );

      setTimeout(async () => {

        try {
          await interaction.channel.delete();
        } catch (error) {
          console.error(error);
        }

      }, 5000);

      return;

    }

    // =================================================
    // DELETE
    // =================================================

    if (subcommand === "delete") {

      if (!isStaff(interaction)) {

        return interaction.reply({

          content:
            "❌ هذا الأمر مخصص لفريق الدعم.",

          ephemeral: true

        });

      }

      await interaction.reply(
        "🗑️ سيتم حذف التذكرة..."
      );

      setTimeout(async () => {

        try {
          await interaction.channel.delete();
        } catch (error) {
          console.error(error);
        }

      }, 3000);

      return;

    }

    // =================================================
    // CLAIM
    // =================================================

    if (subcommand === "claim") {

      if (!isStaff(interaction)) {

        return interaction.reply({

          content:
            "❌ هذا الأمر مخصص لفريق الدعم.",

          ephemeral: true

        });

      }

      const topic =
        interaction.channel.topic || "";

      if (topic.includes("claimed-by:")) {

        return interaction.reply({

          content:
            "❌ هذه التذكرة مستلمة بالفعل.",

          ephemeral: true

        });

      }

      await interaction.channel.setTopic(
        `${topic}|claimed-by:${interaction.user.id}`
      );

      return interaction.reply({

        content:
          `📌 تم استلام التذكرة بواسطة ${interaction.user}.`

      });

    }

    // =================================================
    // UNCLAIM
    // =================================================

    if (subcommand === "unclaim") {

      if (!isStaff(interaction)) {

        return interaction.reply({

          content:
            "❌ هذا الأمر مخصص لفريق الدعم.",

          ephemeral: true

        });

      }

      const topic =
        interaction.channel.topic || "";

      const claimedPart =
        topic
          .split("|")
          .find(part =>
            part.startsWith("claimed-by:")
          );

      if (!claimedPart) {

        return interaction.reply({

          content:
            "❌ التذكرة غير مستلمة.",

          ephemeral: true

        });

      }

      const claimedBy =
        claimedPart.replace(
          "claimed-by:",
          ""
        );

      if (
        claimedBy !== interaction.user.id &&
        !isAdmin(interaction)
      ) {

        return interaction.reply({

          content:
            "❌ فقط الشخص المستلم يمكنه إلغاء الاستلام.",

          ephemeral: true

        });

      }

      const newTopic =
        topic
          .split("|")
          .filter(part =>
            !part.startsWith("claimed-by:")
          )
          .join("|");

      await interaction.channel.setTopic(
        newTopic
      );

      return interaction.reply({

        content:
          "↩️ تم إلغاء استلام التذكرة."

      });

    }

    // =================================================
    // ADD
    // =================================================

    if (subcommand === "add") {

      if (!isStaff(interaction)) {

        return interaction.reply({

          content:
            "❌ هذا الأمر مخصص لفريق الدعم.",

          ephemeral: true

        });

      }

      const user =
        interaction.options.getUser("user");

      await interaction.channel.permissionOverwrites.edit(
        user.id,
        {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true
        }
      );

      return interaction.reply({

        content:
          `✅ تمت إضافة ${user} إلى التذكرة.`

      });

    }

    // =================================================
    // REMOVE
    // =================================================

    if (subcommand === "remove") {

      if (!isStaff(interaction)) {

        return interaction.reply({

          content:
            "❌ هذا الأمر مخصص لفريق الدعم.",

          ephemeral: true

        });

      }

      const user =
        interaction.options.getUser("user");

      await interaction.channel.permissionOverwrites.edit(
        user.id,
        {
          ViewChannel: false
        }
      );

      return interaction.reply({

        content:
          `✅ تمت إزالة ${user} من التذكرة.`

      });

    }

    // =================================================
    // RENAME
    // =================================================

    if (subcommand === "rename") {

      if (!isStaff(interaction)) {

        return interaction.reply({

          content:
            "❌ هذا الأمر مخصص لفريق الدعم.",

          ephemeral: true

        });

      }

      const name =
        interaction.options.getString("name");

      await interaction.channel.setName(
        name.substring(0, 100)
      );

      return interaction.reply({

        content:
          `✅ تم تغيير اسم التذكرة إلى \`${name}\`.`

      });

    }

  } catch (error) {

    console.error("❌ Interaction Error:");
    console.error(error);

    if (!interaction.replied && !interaction.deferred) {

      await interaction.reply({

        content:
          "❌ حدث خطأ أثناء تنفيذ الأمر.",

        ephemeral: true

      }).catch(() => {});

    }

  }

});

// =====================================================
// TOKEN
// =====================================================

if (!TOKEN) {

  console.error(
    "❌ TOKEN غير موجود في Environment Variables."
  );

  process.exit(1);

}

client.login(TOKEN);
